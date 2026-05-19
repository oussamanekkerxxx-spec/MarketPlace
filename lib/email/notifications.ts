import { Resend } from 'resend';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/supabase/server';

export interface OrderEmailPayload {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  customer_address?: string | null;
  customer_notes?: string | null;
  product_id: string;
  product_title: string;
  product_slug?: string | null;
  product_image?: string | null;
  quantity: number;
  unit_price: number;
  shipping_fee: number;
  subtotal: number;
  total: number;
  currency: string;
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
    .select('notification_email, site_name, logo_url')
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
    product_id,
    product_title,
    product_slug,
    product_image,
    quantity,
    unit_price,
    shipping_fee,
    subtotal,
    total,
    currency,
  } = payload;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
  const fromEmail = process.env.FROM_EMAIL || `noreply@${baseUrl.replace(/^https?:\/\//, '')}`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'Resend API key not configured' };
  }

  const publicProductUrl = product_slug
    ? `${baseUrl}/fr/product/${product_slug}`
    : `${baseUrl}`;
  const adminOrderUrl = `${baseUrl}/fr/admin/orders/${order_id}`;
  const adminProductUrl = product_id
    ? `${baseUrl}/fr/admin/products/${product_id}`
    : null;

  // Generate QR code as base64 data URL
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(publicProductUrl, {
      width: 180,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    });
  } catch {
    // QR generation is best-effort; email still sends without it
    qrDataUrl = null;
  }

  const resend = new Resend(apiKey);

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
    shipping_fee,
    subtotal,
    total,
    currency,
    adminOrderUrl,
    adminProductUrl,
    publicProductUrl,
    qrDataUrl,
  });

  const { error: sendError } = await resend.emails.send({
    from: `${siteName} <${fromEmail}>`,
    to: [toEmail],
    subject: `Nouvelle commande - ${order_number}`,
    html,
  });

  // Log to pixel_events as integration audit log
  await supabase.from('pixel_events').insert({
    event_name: 'email_notification',
    event_id: order_number,
    payload: payload as unknown as Record<string, unknown>,
    sent_to_meta: !sendError,
    error_message: sendError ? sendError.message : null,
  });

  if (sendError) {
    return {
      success: false,
      error: 'Email send failed',
      details: sendError.message,
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
  shipping_fee: number;
  subtotal: number;
  total: number;
  currency: string;
  adminOrderUrl: string;
  adminProductUrl: string | null;
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
    shipping_fee,
    subtotal,
    total,
    currency,
    adminOrderUrl,
    adminProductUrl,
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

  const editProductButton = adminProductUrl
    ? `<a href="${adminProductUrl}" style="display:inline-block;background:#f8fafc;color:#334155;padding:12px 20px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid #e2e8f0;">Modifier le produit</a>`
    : '';

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
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:14px;width:140px;">Livraison</td>
                  <td style="padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;color:#1e293b;">${fmt(shipping_fee)} ${currency}</td>
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
                ${editProductButton ? `<a href="${adminProductUrl}" style="display:inline-block;background:#f8fafc;color:#334155;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid #e2e8f0;margin:4px;">Modifier le produit</a>` : ''}
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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
