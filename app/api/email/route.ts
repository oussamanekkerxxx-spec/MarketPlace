import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  // Require a secret token so only server actions can trigger notification emails.
  // Set INTERNAL_API_SECRET in your environment variables.
  const authHeader = request.headers.get('authorization');
  const secret = process.env.INTERNAL_API_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();

    const { data: settings } = await supabase
      .from('site_settings')
      .select('notification_email, site_name')
      .eq('id', 1)
      .single();

    const toEmail = (settings?.notification_email as string) || process.env.ADMIN_EMAIL;
    const siteName = (settings?.site_name as string) || 'Boutique';

    if (!toEmail) {
      return NextResponse.json({ error: 'No notification email configured' }, { status: 400 });
    }

    const body = await request.json();
    const { order_number, customer_name, customer_phone, customer_city, product_title, total, currency, order_id } = body;

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';
    const fromEmail = process.env.FROM_EMAIL || `noreply@${baseUrl.replace(/^https?:\/\//, '')}`;

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Resend API key not configured' }, { status: 400 });
    }

    const resend = new Resend(apiKey);

    const { error: sendError } = await resend.emails.send({
      from: `${siteName} <${fromEmail}>`,
      to: [toEmail],
      subject: `Nouvelle commande - ${order_number}`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8fafc; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
    .header h1 { margin: 0; font-size: 20px; color: #1e293b; }
    .detail { padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
    .detail strong { display: inline-block; width: 120px; color: #64748b; }
    .footer { margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #94a3b8; }
    .btn { display: inline-block; background: #3b82f6; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛒 Nouvelle commande reçue</h1>
    </div>
    <div class="detail"><strong>N° commande:</strong> ${order_number}</div>
    <div class="detail"><strong>Produit:</strong> ${product_title}</div>
    <div class="detail"><strong>Client:</strong> ${customer_name}</div>
    <div class="detail"><strong>Téléphone:</strong> ${customer_phone}</div>
    <div class="detail"><strong>Ville:</strong> ${customer_city}</div>
    <div class="detail"><strong>Total:</strong> ${total} ${currency}</div>
    <div style="margin-top: 24px;">
      <a href="${baseUrl}/fr/admin/orders/${order_id}" class="btn">Voir la commande</a>
    </div>
    <div class="footer">
      <p>Notification automatique - ${siteName}</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    // Log to pixel_events as integration audit log
    await supabase.from('pixel_events').insert({
      event_name: 'email_notification',
      event_id: order_number,
      payload: body as unknown as Record<string, unknown>,
      sent_to_meta: !sendError,
      error_message: sendError ? sendError.message : null,
    });

    if (sendError) {
      return NextResponse.json({ error: 'Email send failed', details: sendError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
