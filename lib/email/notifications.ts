import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/supabase/server';

// --- RESEND (DISABLED) -------------------------------------------------------
// Re-enable by: uncomment the import below, restore the `RESEND PATH` block
// further down, comment out the `GMAIL SMTP PATH` block, and set
// RESEND_API_KEY + FROM_EMAIL in Vercel.
import { Resend } from 'resend';
// -----------------------------------------------------------------------------

export interface OrderEmailPayload {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address?: string | null;
  customer_notes?: string | null;
  product_title: string;
  product_slug?: string | null;
  product_image?: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total: number;
  currency: string;
  discount_percent?: number | null;
  discount_amount?: number | null;
}

export interface SendResult {
  success: boolean;
  error?: string;
  details?: string;
}

/**
 * Sends an order notification email to the configured notification email address.
 * This is the shared core logic used by both the API route and the test action.
 */
export async function sendOrderNotificationEmail(
  payload: OrderEmailPayload
): Promise<SendResult> {
  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from('site_settings')
    .select('notification_email, site_name, logo_url, site_url')
    .eq('id', 1)
    .single();

  const toEmail = (settings?.notification_email as string) || process.env.ADMIN_EMAIL;
  const siteName = (settings?.site_name as string) || 'Boutique';
  const logoUrl = (settings?.logo_url as string) || null;

  if (!toEmail) {
    return { success: false, error: 'No notification email configured' };
  }

  const {
    order_id,
    order_number,
    customer_name,
    customer_phone,
    customer_city,
    customer_address,
    customer_notes,
    product_title,
    product_slug,
    product_image,
    quantity,
    unit_price,
    subtotal,
    total,
    currency,
    discount_percent,
    discount_amount,
  } = payload;

  const baseUrl = (settings?.site_url as string) || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  const publicProductUrl = product_slug
    ? `${baseUrl}/fr/product/${product_slug}`
    : `${baseUrl}`;
  const adminOrderUrl = `${baseUrl}/fr/admin/orders/${order_id}`;
  // DEBUG: log resolved URLs so we can verify the domain is correct
  console.log('[sendOrderNotificationEmail] URL debug:', {
    baseUrl,
    publicProductUrl,
    adminOrderUrl,
    source: settings?.site_url ? 'database site_url' : process.env.NEXT_PUBLIC_SITE_URL ? 'env NEXT_PUBLIC_SITE_URL' : 'fallback',
  });

  // Generate QR code and upload to Supabase Storage for email-safe public URL
  let qrDataUrl: string | null = null;
  try {
    const qrBuffer = await QRCode.toBuffer(publicProductUrl, {
      width: 180,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
      type: 'png',
    });

    const fileName = `qr-${order_number}-${Date.now()}.png`;
    const { error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(fileName, qrBuffer, {
        contentType: 'image/png',
        upsert: false,
        cacheControl: '31536000',
      });

    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('qr-codes').getPublicUrl(fileName);
      qrDataUrl = urlData.publicUrl;
    }
  } catch {
    // QR generation/upload is best-effort; email still sends without it
    qrDataUrl = null;
  }

  const html = buildEmailHtml({
    siteName,
    logoUrl,
    order_number,
    customer_name,
    customer_phone,
    customer_city,
    customer_address: customer_address || null,
    customer_notes: customer_notes || null,
    product_title,
    product_image: product_image || null,
    quantity,
    unit_price,
    subtotal,
    total,
    currency,
    discount_percent: discount_percent ?? null,
    discount_amount: discount_amount ?? null,
    adminOrderUrl,
    publicProductUrl,
    qrDataUrl,
  });

  // === RESEND PATH (ACTIVE) ==================================================
  const fromEmail = process.env.FROM_EMAIL || `noreply@${baseUrl.replace(/^https?:\/\//, '')}`;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: 'Resend API key not configured',
      details: 'Add RESEND_API_KEY in Vercel Dashboard → Settings → Environment Variables → Production, then redeploy.',
    };
  }
  const resend = new Resend(apiKey);

  let sendErrorMessage: string | null = null;
  try {
    const { error: sendError } = await resend.emails.send({
      from: `${siteName} <${fromEmail}>`,
      to: [toEmail],
      subject: `Nouvelle commande - ${order_number}`,
      html,
    });
    sendErrorMessage = sendError ? sendError.message : null;
  } catch (err) {
    sendErrorMessage = err instanceof Error ? err.message : String(err);
  }
  // =========================================================================

  // Log to pixel_events as integration audit log
  await supabase.from('pixel_events').insert({
    event_name: 'email_notification',
    event_id: order_number,
    payload: payload as unknown as Record<string, unknown>,
    sent_to_meta: !sendErrorMessage,
    error_message: sendErrorMessage,
  });

  if (sendErrorMessage) {
    return {
      success: false,
      error: 'Email send failed',
      details: sendErrorMessage,
    };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Email template builder
// ---------------------------------------------------------------------------

interface EmailData {
  siteName: string;
  logoUrl: string | null;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address: string | null;
  customer_notes: string | null;
  product_title: string;
  product_image: string | null;
  quantity: number;
  unit_price: number;
  subtotal: number;
  total: number;
  currency: string;
  discount_percent: number | null;
  discount_amount: number | null;
  adminOrderUrl: string;
  publicProductUrl: string;
  qrDataUrl: string | null;
}

function buildEmailHtml(data: EmailData): string {
  const {
    siteName,
    logoUrl,
    order_number,
    customer_name,
    customer_phone,
    customer_city,
    customer_address,
    customer_notes,
    product_title,
    product_image,
    quantity,
    unit_price,
    subtotal,
    total,
    currency,
    discount_percent,
    discount_amount,
    adminOrderUrl,
    publicProductUrl,
    qrDataUrl,
  } = data;

  const fmt = (n: number) =>
    Number.isFinite(n)
      ? n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—';

  const logoSection = logoUrl
    ? `<div style="text-align:center;padding-bottom:16px;">
         <img src="${logoUrl}" alt="${escapeHtml(siteName)}" style="max-height:48px;max-width:160px;" />
       </div>`
    : `<div style="text-align:center;padding-bottom:8px;font-size:18px;font-weight:700;color:#1e293b;">${escapeHtml(siteName)}</div>`;

  const addressRow = customer_address
    ? `<tr>
         <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:120px;">Adresse</td>
         <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${escapeHtml(customer_address)}</td>
       </tr>`
    : '';

  const notesRow = customer_notes
    ? `<tr>
         <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:120px;">Notes</td>
         <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${escapeHtml(customer_notes)}</td>
       </tr>`
    : '';

  const productImageSection = product_image
    ? `<div style="margin-bottom:12px;">
         <img src="${product_image}" alt="${escapeHtml(product_title)}" style="max-width:100%;max-height:200px;border-radius:8px;border:1px solid #e2e8f0;" />
       </div>`
    : '';

  // Modifier button removed — admin doesn't need to edit product from order email

  const qrSection = qrDataUrl
    ? `<div style="text-align:center;margin-top:24px;padding-top:24px;border-top:1px solid #e2e8f0;">
         <p style="margin:0 0 12px;font-size:13px;color:#64748b;">Scanner pour ouvrir la fiche produit</p>
         <img src="${qrDataUrl}" alt="QR code" style="width:180px;height:180px;border-radius:8px;border:1px solid #e2e8f0;" />
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nouvelle commande - ${escapeHtml(order_number)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="padding:24px 24px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
              ${logoSection}
              <h1 style="margin:0;font-size:20px;color:#1e293b;text-align:center;">🛒 Nouvelle commande reçue</h1>
              <p style="margin:6px 0 0;font-size:14px;color:#64748b;text-align:center;">${escapeHtml(order_number)}</p>
            </td>
          </tr>

          <!-- Client Info -->
          <tr>
            <td style="padding:20px 24px;">
              <h2 style="margin:0 0 12px;font-size:16px;color:#1e293b;">👤 Informations client</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:120px;">Nom</td>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;font-weight:600;">${escapeHtml(customer_name)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:120px;">Téléphone</td>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;direction:ltr;text-align:left;">${escapeHtml(customer_phone)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:120px;">Ville</td>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${escapeHtml(customer_city)}</td>
                </tr>
                ${addressRow}
                ${notesRow}
              </table>
            </td>
          </tr>

          <!-- Product / Order Info -->
          <tr>
            <td style="padding:0 24px 20px;">
              <h2 style="margin:0 0 12px;font-size:16px;color:#1e293b;">📦 Détails de la commande</h2>
              ${productImageSection}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:140px;">Produit</td>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;font-weight:600;">${escapeHtml(product_title)}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:140px;">Quantité</td>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${quantity}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:140px;">Prix unitaire</td>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${fmt(unit_price)} ${currency}</td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:140px;">Sous-total</td>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${fmt(subtotal)} ${currency}</td>
                </tr>
                ${discount_amount && discount_amount > 0 ? `<tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:140px;">Remise</td>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#16a34a;font-weight:600;">-${fmt(discount_amount)} ${currency} (${discount_percent}%)</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:140px;">Livraison</td>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#16a34a;font-weight:600;">Gratuite</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:2px solid #e2e8f0;color:#1e293b;font-size:15px;width:140px;font-weight:700;">Total</td>
                  <td style="padding:10px 0;border-bottom:2px solid #e2e8f0;font-size:15px;color:#1e293b;font-weight:700;">${fmt(total)} ${currency}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding:0 24px 20px;">
              <div style="text-align:center;">
                <a href="${adminOrderUrl}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;margin:4px;">Voir la commande</a>
                <a href="${publicProductUrl}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;margin:4px;">Fiche produit</a>
              </div>
            </td>
          </tr>

          <!-- QR Code -->
          <tr>
            <td style="padding:0 24px 24px;">
              ${qrSection}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">Notification automatique — ${escapeHtml(siteName)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Cart / multi-item order email
// ---------------------------------------------------------------------------

export interface CartEmailItem {
  product_title: string;
  product_image?: string | null;
  quantity: number;
  unit_price: number;
  discount_percent?: number | null;
  discount_amount?: number | null;
  line_total: number;
  currency: string;
}

export interface CartOrderEmailPayload {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address?: string | null;
  customer_notes?: string | null;
  items: CartEmailItem[];
  subtotal: number;
  total: number;
  currency: string;
  discount_total: number;
}

export async function sendCartOrderEmail(payload: CartOrderEmailPayload): Promise<SendResult> {
  const supabase = createAdminClient();

  const { data: settings } = await supabase
    .from('site_settings')
    .select('notification_email, site_name, logo_url, site_url')
    .eq('id', 1)
    .single();

  const toEmail = (settings?.notification_email as string) || process.env.ADMIN_EMAIL;
  const siteName = (settings?.site_name as string) || 'Boutique';
  const logoUrl = (settings?.logo_url as string) || null;

  if (!toEmail) {
    return { success: false, error: 'No notification email configured' };
  }

  const baseUrl = (settings?.site_url as string) || process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const adminOrderUrl = `${baseUrl}/fr/admin/orders/${payload.order_id}`;

  const fmt = (n: number) =>
    Number.isFinite(n)
      ? n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—';

  const logoSection = logoUrl
    ? `<div style="text-align:center;padding-bottom:16px;"><img src="${logoUrl}" alt="${escapeHtml(siteName)}" style="max-height:48px;max-width:160px;" /></div>`
    : `<div style="text-align:center;padding-bottom:8px;font-size:18px;font-weight:700;color:#1e293b;">${escapeHtml(siteName)}</div>`;

  const itemsRows = payload.items
    .map((item) => {
      const discountLabel =
        item.discount_percent && item.discount_percent > 0
          ? `<span style="color:#16a34a;font-size:12px;">(-${item.discount_percent}%)</span>`
          : '';
      const imgCell = item.product_image
        ? `<td style="padding:10px 0;border-bottom:1px solid #e2e8f0;width:60px;"><img src="${item.product_image}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid #e2e8f0;" /></td>`
        : `<td style="padding:10px 0;border-bottom:1px solid #e2e8f0;width:60px;"><div style="width:48px;height:48px;background:#f1f5f9;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;color:#94a3b8;">${escapeHtml(item.product_title.charAt(0))}</div></td>`;
      return `<tr>
        ${imgCell}
        <td style="padding:10px 8px;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">
          <div style="font-weight:600;">${escapeHtml(item.product_title)}</div>
          <div style="font-size:12px;color:#64748b;">Qté: ${item.quantity} × ${fmt(item.unit_price)} ${item.currency} ${discountLabel}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;font-weight:600;text-align:right;white-space:nowrap;">${fmt(item.line_total)} ${item.currency}</td>
      </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Nouvelle commande - ${escapeHtml(payload.order_number)}</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="padding:24px 24px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
          ${logoSection}
          <h1 style="margin:0;font-size:20px;color:#1e293b;text-align:center;">🛒 Nouvelle commande reçue</h1>
          <p style="margin:6px 0 0;font-size:14px;color:#64748b;text-align:center;">${escapeHtml(payload.order_number)}</p>
        </td></tr>
        <tr><td style="padding:20px 24px;">
          <h2 style="margin:0 0 12px;font-size:16px;color:#1e293b;">👤 Informations client</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:120px;">Nom</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;font-weight:600;">${escapeHtml(payload.customer_name)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:120px;">Téléphone</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;direction:ltr;text-align:left;">${escapeHtml(payload.customer_phone)}</td></tr>
            <tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:120px;">Ville</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${escapeHtml(payload.customer_city)}</td></tr>
            ${payload.customer_address ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:120px;">Adresse</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${escapeHtml(payload.customer_address)}</td></tr>` : ''}
            ${payload.customer_notes ? `<tr><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:120px;">Notes</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${escapeHtml(payload.customer_notes)}</td></tr>` : ''}
          </table>
        </td></tr>
        <tr><td style="padding:0 24px 20px;">
          <h2 style="margin:0 0 12px;font-size:16px;color:#1e293b;">📦 Produits commandés</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${itemsRows}
            <tr><td colspan="2" style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Sous-total</td><td style="padding:10px 0;border-bottom:1px solid #e2e8f0;font-size:14px;text-align:right;white-space:nowrap;">${fmt(payload.subtotal)} ${payload.currency}</td></tr>
            ${payload.discount_total > 0 ? `<tr><td colspan="2" style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#16a34a;">Remise totale</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#16a34a;text-align:right;white-space:nowrap;font-weight:600;">-${fmt(payload.discount_total)} ${payload.currency}</td></tr>` : ''}
            <tr><td colspan="2" style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#64748b;">Livraison</td><td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#16a34a;text-align:right;white-space:nowrap;font-weight:600;">Gratuite</td></tr>
            <tr><td colspan="2" style="padding:10px 0;border-bottom:2px solid #e2e8f0;font-size:15px;color:#1e293b;font-weight:700;">Total</td><td style="padding:10px 0;border-bottom:2px solid #e2e8f0;font-size:15px;color:#1e293b;font-weight:700;text-align:right;white-space:nowrap;">${fmt(payload.total)} ${payload.currency}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:0 24px 20px;text-align:center;">
          <a href="${adminOrderUrl}" style="display:inline-block;background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;margin:4px;">Voir la commande</a>
        </td></tr>
        <tr><td style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Notification automatique — ${escapeHtml(siteName)}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const fromEmail = process.env.FROM_EMAIL || `noreply@${baseUrl.replace(/^https?:\/\//, '')}`;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Resend API key not configured' };
  }
  const resend = new Resend(apiKey);

  let sendErrorMessage: string | null = null;
  try {
    const { error: sendError } = await resend.emails.send({
      from: `${siteName} <${fromEmail}>`,
      to: [toEmail],
      subject: `Nouvelle commande - ${payload.order_number}`,
      html,
    });
    sendErrorMessage = sendError ? sendError.message : null;
  } catch (err) {
    sendErrorMessage = err instanceof Error ? err.message : String(err);
  }

  await supabase.from('pixel_events').insert({
    event_name: 'cart_email_notification',
    event_id: payload.order_number,
    payload: payload as unknown as Record<string, unknown>,
    sent_to_meta: !sendErrorMessage,
    error_message: sendErrorMessage,
  });

  if (sendErrorMessage) {
    return { success: false, error: 'Email send failed', details: sendErrorMessage };
  }
  return { success: true };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
