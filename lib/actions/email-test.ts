'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Server action — called from the admin settings form "Test email" button.
 * Sends a test notification email to the configured notification email address.
 * Returns a structured result so the UI can show success / error inline.
 */
export async function testEmailNotification(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Non authentifié' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  type ProfileRow = { role: 'admin' | 'manager' };
  const userProfile = profile as ProfileRow | null;

  if (userProfile?.role !== 'admin') {
    return { success: false, error: 'Accès réservé aux administrateurs' };
  }

  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('notification_email')
    .eq('id', 1)
    .single();

  console.log('[email-test] site_settings row:', settings, 'error:', settingsError);

  const notificationEmail = (settings?.notification_email as string) || process.env.ADMIN_EMAIL;

  if (!notificationEmail) {
    const debug = settingsError
      ? `Erreur DB: ${settingsError.message}`
      : `DB value: ${JSON.stringify(settings?.notification_email)}`;
    return { success: false, error: `Aucun email de notification configuré. ${debug}` };
  }

  const apiSecret = process.env.INTERNAL_API_SECRET;
  if (!apiSecret) {
    return { success: false, error: 'INTERNAL_API_SECRET non configuré côté serveur.' };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const testPayload = {
    order_id: '00000000-0000-0000-0000-000000000000',
    order_number: 'TEST-001',
    customer_name: 'Client Test',
    customer_phone: '+212600000000',
    customer_city: 'Casablanca',
    customer_address: '123 Rue des Tests, Quartier Exemple',
    customer_notes: 'Ceci est un email de test. Aucune commande réelle n\'a été passée.',
    product_id: '00000000-0000-0000-0000-000000000000',
    product_title: 'Produit de démonstration',
    product_slug: 'produit-demo',
    product_image: null,
    quantity: 2,
    unit_price: 199.0,
    shipping_fee: 30.0,
    subtotal: 398.0,
    total: 428.0,
    currency: 'MAD',
  };

  try {
    const res = await fetch(`${siteUrl}/api/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiSecret}`,
      },
      body: JSON.stringify(testPayload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.details
        ? `${data.error}: ${data.details}`
        : data.error || `Erreur HTTP ${res.status}`;
      console.error('[email-test] route error:', res.status, data);
      return { success: false, error: message };
    }

    return { success: true };
  } catch (err) {
    console.error('[email-test] fetch error:', err);
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
