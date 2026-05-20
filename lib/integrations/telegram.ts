'use server';

import { createClient } from '@/lib/supabase/server';

// ---------------------------------------------------------------------------
// Localised message strings
// ---------------------------------------------------------------------------
const MESSAGES = {
  fr: {
    newOrder: '🛒 <b>Nouvelle commande</b>',
    number: 'N°',
    product: 'Produit',
    customer: 'Client',
    phone: 'Téléphone',
    city: 'Ville',
    total: 'Total',
    viewOrder: 'Voir la commande',
    testTitle: '✅ Test de connexion réussi !',
    testBody: 'Votre bot Telegram est correctement configuré. Vous recevrez les prochaines commandes ici.',
  },
  en: {
    newOrder: '🛒 <b>New order</b>',
    number: 'No.',
    product: 'Product',
    customer: 'Customer',
    phone: 'Phone',
    city: 'City',
    total: 'Total',
    viewOrder: 'View order',
    testTitle: '✅ Connection test successful!',
    testBody: 'Your Telegram bot is correctly configured. Upcoming orders will be sent here.',
  },
  ar: {
    newOrder: '🛒 <b>طلب جديد</b>',
    number: 'رقم',
    product: 'المنتج',
    customer: 'العميل',
    phone: 'الهاتف',
    city: 'المدينة',
    total: 'المجموع',
    viewOrder: 'عرض الطلب',
    testTitle: '✅ نجح اختبار الاتصال!',
    testBody: 'تم تكوين بوت تيليغرام بشكل صحيح. ستصل الطلبات القادمة هنا.',
  },
} as const;

type Locale = keyof typeof MESSAGES;

// ---------------------------------------------------------------------------
// Low-level sender — single responsibility: POST one message to Telegram
// ---------------------------------------------------------------------------
async function sendMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = (await res.json()) as { ok: boolean; description?: string };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.description ?? `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ---------------------------------------------------------------------------
// Helper — read only the telegram-relevant columns from site_settings
// ---------------------------------------------------------------------------
async function getTelegramConfig() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('site_settings')
    .select('telegram_bot_token, telegram_chat_id, default_locale')
    .eq('id', 1)
    .single();

  return {
    botToken: (data?.telegram_bot_token as string | null) ?? null,
    chatId: (data?.telegram_chat_id as string | null) ?? null,
    locale: ((data?.default_locale as string) || 'fr') as Locale,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface TelegramOrderPayload {
  order_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_city: string;
  product_title: string;
  total: number;
  currency: string;
}

/**
 * Fire-and-forget — called from createReservation after order is persisted.
 * Failures are logged to stderr but never throw (must not break the order flow).
 */
export async function sendTelegramNotification(payload: TelegramOrderPayload): Promise<void> {
  try {
    const { botToken, chatId, locale } = await getTelegramConfig();
    if (!botToken || !chatId) return;

    const t = MESSAGES[locale] ?? MESSAGES.fr;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const text = [
      t.newOrder,
      '',
      `<b>${t.number}:</b> ${payload.order_number}`,
      `<b>${t.product}:</b> ${payload.product_title}`,
      `<b>${t.customer}:</b> ${payload.customer_name}`,
      `<b>${t.phone}:</b> ${payload.customer_phone}`,
      `<b>${t.city}:</b> ${payload.customer_city}`,
      `<b>${t.total}:</b> ${payload.total} ${payload.currency}`,
      '',
      `<a href="${baseUrl}/${locale}/admin/orders/${payload.order_id}">${t.viewOrder}</a>`,
    ].join('\n');

    const result = await sendMessage(botToken, chatId, text);
    if (!result.ok) {
      console.error('[telegram] notification failed:', result.error);
    }
  } catch (err) {
    console.error('[telegram] unexpected error:', err);
  }
}

/**
 * Server action — called from the admin settings form "Test" button.
 * Returns a structured result so the UI can show success / error inline.
 */
export async function testTelegramNotification(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Non authentifié' };

  // Any authenticated user can test Telegram (team/roles removed).

  const { botToken, chatId, locale } = await getTelegramConfig();

  if (!botToken && !chatId) {
    return { success: false, error: 'Token et Chat ID manquants — remplissez les deux champs.' };
  }
  if (!botToken) {
    return { success: false, error: 'Bot Token manquant.' };
  }
  if (!chatId) {
    return { success: false, error: 'Chat ID manquant.' };
  }

  const t = MESSAGES[locale] ?? MESSAGES.fr;
  const result = await sendMessage(botToken, chatId, `${t.testTitle}\n\n${t.testBody}`);

  if (!result.ok) {
    return { success: false, error: result.error };
  }
  return { success: true };
}
