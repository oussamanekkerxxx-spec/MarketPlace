'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { sendOrderNotificationEmail } from '@/lib/email/notifications';
import { sendCapiEvent } from '@/lib/facebook/capi';
import { sendTelegramNotification } from '@/lib/integrations/telegram';
import { rateLimit } from '@/lib/rate-limit';
import { createClient } from '@/lib/supabase/server';
import { detectSource } from '@/lib/utils/attribution';
import { reservationServerSchema, type ReservationServerInput } from '@/lib/validation/reservation';

export async function createReservation(formData: ReservationServerInput) {
  const parsed = reservationServerSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: 'Informations de commande invalides' };
  }

  const reservation = parsed.data;

  // Honeypot check - reject bots immediately.
  if (reservation.website && reservation.website.trim().length > 0) {
    return { error: 'Bot detected' };
  }

  // Rate limit by IP.
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ip = (forwardedFor?.split(',')[0] || realIp || 'unknown').trim();
  const userAgent = headersList.get('user-agent') || null;

  const limitResult = rateLimit(`order:${ip}`, 5, 60 * 60 * 1000);
  if (!limitResult.success) {
    return { error: 'Trop de commandes depuis cette adresse. Veuillez réessayer dans une heure.' };
  }

  // Verify Turnstile token (skip if the secret key is not configured, e.g. local dev).
  // Also skip if the client explicitly sent the no-turnstile placeholder.
  const turnstileToken = reservation.turnstile_token;
  if (turnstileToken && turnstileToken !== '__no_turnstile__' && process.env.TURNSTILE_SECRET_KEY) {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: ip,
      }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      return { error: 'Vérification de sécurité échouée. Veuillez réessayer.' };
    }
  }

  const supabase = await createClient();

  const [{ data: product, error: productError }, { data: city, error: cityError }] = await Promise.all([
    supabase
      .from('products')
      .select('title_fr, slug, price, currency, track_inventory, stock_quantity, product_images(url, is_primary)')
      .eq('id', reservation.product_id)
      .eq('is_active', true)
      .single(),
    supabase
      .from('cities')
      .select('name_fr, shipping_fee')
      .eq('id', reservation.customer_city_id)
      .eq('is_active', true)
      .single(),
  ]);

  if (productError || !product) {
    return { error: 'Produit introuvable ou indisponible' };
  }

  if (cityError || !city) {
    return { error: 'Ville de livraison invalide' };
  }

  const unitPrice = Number(product.price);
  const shippingFee = Number(city.shipping_fee);
  const stockQuantity = Number(product.stock_quantity ?? 0);
  const trackInventory = Boolean(product.track_inventory);

  if (!Number.isFinite(unitPrice) || !Number.isFinite(shippingFee)) {
    return { error: 'Impossible de calculer le total de la commande' };
  }

  if (trackInventory && (!Number.isFinite(stockQuantity) || stockQuantity < reservation.quantity)) {
    return { error: 'Quantité demandée indisponible' };
  }

  const subtotal = unitPrice * reservation.quantity;
  const total = subtotal + shippingFee;
  const currency =
    typeof product.currency === 'string' && product.currency.trim().length > 0
      ? product.currency
      : 'MAD';
  const customerCityName = city.name_fr;
  const normalizedPhone = reservation.customer_phone.replace(/\s/g, '');
  const productTitle = product.title_fr || 'Produit';
  const productSlug = product.slug || '';
  const productImages = Array.isArray(product.product_images) ? product.product_images : [];
  const productImage =
    productImages.find((image) => image?.is_primary)?.url ||
    productImages[0]?.url ||
    null;

  const source = detectSource(reservation.utm_source, reservation.referrer);

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: reservation.customer_name,
      customer_phone: normalizedPhone,
      customer_city_id: reservation.customer_city_id,
      customer_city_name: customerCityName,
      customer_address: reservation.customer_address || null,
      customer_notes: reservation.customer_notes || null,
      subtotal,
      shipping_fee: shippingFee,
      total,
      currency,
      status: 'pending',
      source,
      utm_source: reservation.utm_source || null,
      utm_medium: reservation.utm_medium || null,
      utm_campaign: reservation.utm_campaign || null,
      utm_term: reservation.utm_term || null,
      utm_content: reservation.utm_content || null,
      referrer: reservation.referrer || null,
      ip_address: ip,
      user_agent: userAgent,
      locale: 'fr',
    })
    .select()
    .single();

  if (orderError || !order) {
    return { error: orderError?.message || 'Impossible de créer la commande' };
  }

  const { error: itemError } = await supabase
    .from('order_items')
    .insert({
      order_id: order.id,
      product_id: reservation.product_id,
      product_title_snapshot: productTitle,
      product_image_snapshot: productImage,
      product_slug_snapshot: productSlug,
      unit_price_at_order: unitPrice,
      quantity: reservation.quantity,
    });

  if (itemError) {
    return { error: itemError.message };
  }

  const integrationPayload = {
    order_id: order.id,
    order_number: order.order_number,
    customer_name: reservation.customer_name,
    customer_phone: normalizedPhone,
    customer_city: customerCityName,
    customer_address: reservation.customer_address || null,
    customer_notes: reservation.customer_notes || null,
    product_id: reservation.product_id,
    product_title: productTitle,
    product_slug: productSlug,
    product_image: productImage,
    quantity: reservation.quantity,
    unit_price: unitPrice,
    shipping_fee: shippingFee,
    subtotal,
    total,
    currency,
  };

  Promise.allSettled([
    sendTelegramNotification(integrationPayload),
    sendOrderNotificationEmail(integrationPayload),
    sendCapiEvent({
      eventName: 'Lead',
      eventId: `lead-${order.order_number}`,
      userData: { phone: normalizedPhone, city: customerCityName },
      customData: {
        value: total,
        currency,
        content_name: productTitle,
      },
    }),
    sendCapiEvent({
      eventName: 'Purchase',
      eventId: `purchase-${order.order_number}`,
      userData: { phone: normalizedPhone, city: customerCityName },
      customData: {
        value: total,
        currency,
        content_ids: [reservation.product_id],
        content_type: 'product',
        content_name: productTitle,
      },
    }),
  ]).then((results) => {
    const emailResult = results[1];
    if (emailResult.status === 'rejected') {
      console.error('[order] Email notification failed:', emailResult.reason);
    } else if (emailResult.status === 'fulfilled' && !emailResult.value.success) {
      console.error('[order] Email notification failed:', emailResult.value.error, emailResult.value.details);
    }
  }).catch(() => {});

  revalidatePath('/[locale]/admin', 'page');
  revalidatePath('/[locale]/admin/orders', 'page');
  revalidateTag('orders', 'default');

  return { success: true, orderNumber: order.order_number, total, currency };
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const result = await updateOrderStatuses([orderId], newStatus);
  return result;
}

export async function updateOrderStatuses(orderIds: string[], newStatus: string) {
  if (!orderIds.length) return { error: 'Aucune commande sélectionnée' };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  type ProfileRow = { role: 'admin' | 'manager' };
  const userProfile = profile as ProfileRow | null;

  if (!userProfile || !['admin', 'manager'].includes(userProfile.role)) {
    return { error: 'Accès non autorisé' };
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: newStatus })
    .in('id', orderIds);

  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin', 'page');
  revalidatePath('/[locale]/admin/orders', 'page');
  revalidateTag('orders', 'default');

  return { success: true, count: orderIds.length };
}

export async function updateOrderNotes(orderId: string, notes: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  type ProfileRow = { role: 'admin' | 'manager' };
  const userProfile = profile as ProfileRow | null;

  if (!userProfile || !['admin', 'manager'].includes(userProfile.role)) {
    return { error: 'Accès non autorisé' };
  }

  const { error } = await supabase
    .from('orders')
    .update({ admin_notes: notes })
    .eq('id', orderId);

  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/orders', 'page');
  revalidateTag('orders', 'default');

  return { success: true };
}

export async function assignOrder(orderId: string, managerId: string | null) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  type ProfileRow = { role: 'admin' | 'manager' };
  const userProfile = profile as ProfileRow | null;

  if (!userProfile || !['admin', 'manager'].includes(userProfile.role)) {
    return { error: 'Accès non autorisé' };
  }

  const { error } = await supabase
    .from('orders')
    .update({ assigned_to: managerId })
    .eq('id', orderId);

  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/orders', 'page');
  revalidateTag('orders', 'default');

  return { success: true };
}

export async function anonymizeOrder(orderId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  type ProfileRow = { role: 'admin' | 'manager' };
  const userProfile = profile as ProfileRow | null;

  if (userProfile?.role !== 'admin') {
    return { error: 'Accès réservé aux administrateurs' };
  }

  const { error } = await supabase
    .from('orders')
    .update({
      customer_name: 'Client supprimé',
      customer_phone: '—',
      customer_address: null,
      customer_notes: null,
      ip_address: null,
      user_agent: null,
    })
    .eq('id', orderId);

  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/orders', 'page');
  revalidatePath(`/[locale]/admin/orders/${orderId}`, 'page');
  revalidateTag('orders', 'default');

  return { success: true };
}
