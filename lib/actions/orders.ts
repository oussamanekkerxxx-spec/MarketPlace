'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { headers } from 'next/headers';
import { sendOrderNotificationEmail, sendCartOrderEmail } from '@/lib/email/notifications';
import { sendCapiEvent } from '@/lib/facebook/capi';
import { sendTelegramNotification } from '@/lib/integrations/telegram';
import { rateLimit } from '@/lib/rate-limit';
import { createAdminClient, createClient } from '@/lib/supabase/server';
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
        // remoteip intentionally omitted: Facebook/Instagram in-app browsers
        // route through Meta proxies, causing IP mismatches that fail
        // Turnstile verification. Cloudflare accepts requests without it.
      }),
    });

    const verifyData = (await verifyRes.json()) as {
      success: boolean;
      'error-codes'?: string[];
      challenge_ts?: string;
    };
    if (!verifyData.success) {
      console.warn('[Turnstile] Verification failed:', verifyData['error-codes']);
      return { error: 'Vérification de sécurité échouée. Veuillez réessayer.' };
    }
  }

  // Use the service-role client for the public order flow. The request is
  // already fully validated server-side (Zod schema, Turnstile, rate limit,
  // honeypot), and we don't want browser cookie state — which IG/FB in-app
  // browsers handle inconsistently — to put us into an RLS path. With this
  // client the insert no longer depends on the visitor's auth state.
  const supabase = createAdminClient();

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
  const shippingFee = 0; // Free shipping for all cities
  const stockQuantity = Number(product.stock_quantity ?? 0);
  const trackInventory = Boolean(product.track_inventory);

  if (!Number.isFinite(unitPrice) || !Number.isFinite(shippingFee)) {
    return { error: 'Impossible de calculer le total de la commande' };
  }

  if (trackInventory && (!Number.isFinite(stockQuantity) || stockQuantity < reservation.quantity)) {
    return { error: 'Quantité demandée indisponible' };
  }

  // Apply bulk discount server-side (source of truth from DB)
  const bulkThreshold = (product as Record<string, unknown>).bulk_discount_threshold as number | null;
  const bulkPercent = (product as Record<string, unknown>).bulk_discount_percent as number | null;
  const hasBulkDiscount =
    bulkThreshold && bulkPercent && reservation.quantity >= bulkThreshold;
  const discountPercent = hasBulkDiscount ? bulkPercent : 0;
  const discountedUnitPrice = hasBulkDiscount
    ? unitPrice * (1 - discountPercent / 100)
    : unitPrice;
  const subtotal = discountedUnitPrice * reservation.quantity;
  const discountAmount = hasBulkDiscount
    ? Number((unitPrice * reservation.quantity - subtotal).toFixed(2))
    : 0;
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
      discount_percent: discountPercent || null,
      discount_amount: discountAmount || null,
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
    discount_percent: discountPercent || null,
    discount_amount: discountAmount || null,
  };

  Promise.allSettled([
    sendTelegramNotification(integrationPayload),
    sendOrderNotificationEmail(integrationPayload),
    sendCapiEvent({
      eventName: 'Lead',
      eventId: `lead-${order.order_number}`,
      userData: {
        phone: normalizedPhone,
        city: customerCityName,
        name: reservation.customer_name,
        country: 'MA',
        external_id: order.id,
      },
      customData: {
        value: total,
        currency,
        content_name: productTitle,
      },
    }),
    sendCapiEvent({
      eventName: 'Purchase',
      eventId: `purchase-${order.order_number}`,
      userData: {
        phone: normalizedPhone,
        city: customerCityName,
        name: reservation.customer_name,
        country: 'MA',
        external_id: order.id,
      },
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


// ---------------------------------------------------------------------------
// Cart / multi-product checkout
// ---------------------------------------------------------------------------

interface CartOrderItemInput {
  product_id: string;
  quantity: number;
}

interface CartOrderInput {
  items: CartOrderItemInput[];
  customer_name: string;
  customer_phone: string;
  customer_city_id: string;
  customer_address?: string;
  customer_notes?: string;
}

export async function createOrderFromCart(input: CartOrderInput) {
  // Same reasoning as createReservation: use service-role to avoid being held
  // hostage by inconsistent cookie behavior in IG/FB in-app browsers.
  const supabase = createAdminClient();

  // Basic validation
  if (!input.items?.length) return { error: 'Panier vide' };
  if (!input.customer_name?.trim()) return { error: 'Nom requis' };
  if (!input.customer_phone?.trim()) return { error: 'Téléphone requis' };
  if (!input.customer_city_id) return { error: 'Ville requise' };

  // Rate limit by phone
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const realIp = headersList.get('x-real-ip');
  const ip = (forwardedFor?.split(',')[0] || realIp || 'unknown').trim();
  const userAgent = headersList.get('user-agent') || null;

  const limitResult = rateLimit(`order:${ip}`, 5, 60 * 60 * 1000);
  if (!limitResult.success) {
    return { error: 'Trop de commandes depuis cette adresse. Veuillez réessayer dans une heure.' };
  }

  // Fetch city
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('name_fr')
    .eq('id', input.customer_city_id)
    .single();

  if (cityError || !city) {
    return { error: 'Ville de livraison invalide' };
  }

  // Fetch all products
  const productIds = input.items.map((i) => i.product_id);
  const { data: products } = await supabase
    .from('products')
    .select('id, title_fr, slug, price, currency, track_inventory, stock_quantity, bulk_discount_threshold, bulk_discount_percent, product_images(url, is_primary)')
    .eq('is_active', true)
    .in('id', productIds);

  if (!products || products.length !== productIds.length) {
    return { error: 'Certains produits sont introuvables ou indisponibles' };
  }

  const productMap = new Map(products.map((p) => [p.id as string, p as Record<string, unknown>]));

  // Build order items with discount calculation
  const orderItems: Array<{
    product_id: string;
    product_title_snapshot: string;
    product_image_snapshot: string | null;
    product_slug_snapshot: string;
    unit_price_at_order: number;
    quantity: number;
    discount_percent: number;
    discount_amount: number;
    line_total: number;
  }> = [];

  let subtotal = 0;
  let totalDiscount = 0;

  for (const item of input.items) {
    const product = productMap.get(item.product_id);
    if (!product) continue;

    const unitPrice = Number(product.price);
    const stockQty = Number(product.stock_quantity ?? 0);
    const trackInventory = Boolean(product.track_inventory);

    if (trackInventory && stockQty < item.quantity) {
      return { error: `Stock insuffisant pour ${product.title_fr}` };
    }

    const bulkThreshold = product.bulk_discount_threshold as number | null;
    const bulkPercent = product.bulk_discount_percent as number | null;
    const hasDiscount = bulkThreshold && bulkPercent && item.quantity >= bulkThreshold;
    const discountPercent = hasDiscount ? bulkPercent : 0;
    const discountedUnitPrice = hasDiscount
      ? unitPrice * (1 - discountPercent / 100)
      : unitPrice;
    const lineTotal = discountedUnitPrice * item.quantity;
    const discountAmount = hasDiscount
      ? Number((unitPrice * item.quantity - lineTotal).toFixed(2))
      : 0;

    const productImages = Array.isArray(product.product_images) ? product.product_images : [];
    const productImage =
      productImages.find((image: { is_primary?: boolean }) => image?.is_primary)?.url ||
      productImages[0]?.url ||
      null;

    orderItems.push({
      product_id: item.product_id,
      product_title_snapshot: (product.title_fr as string) || 'Produit',
      product_image_snapshot: productImage,
      product_slug_snapshot: (product.slug as string) || '',
      unit_price_at_order: discountedUnitPrice,
      quantity: item.quantity,
      discount_percent: discountPercent,
      discount_amount: discountAmount,
      line_total: lineTotal,
    });

    subtotal += unitPrice * item.quantity;
    totalDiscount += discountAmount;
  }

  const shippingFee = 0; // Free shipping
  const total = subtotal - totalDiscount + shippingFee;
  const currency = (products[0]?.currency as string) || 'MAD';
  const customerCityName = city.name_fr;
  const normalizedPhone = input.customer_phone.replace(/\s/g, '');

  // Create order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: input.customer_name,
      customer_phone: normalizedPhone,
      customer_city_id: input.customer_city_id,
      customer_city_name: customerCityName,
      customer_address: input.customer_address || null,
      customer_notes: input.customer_notes || null,
      subtotal,
      shipping_fee: shippingFee,
      total,
      currency,
      discount_percent: totalDiscount > 0 ? Number(((totalDiscount / subtotal) * 100).toFixed(2)) : 0,
      discount_amount: totalDiscount || null,
      status: 'pending',
      source: 'direct',
      ip_address: ip,
      user_agent: userAgent,
      locale: 'fr',
    })
    .select()
    .single();

  if (orderError || !order) {
    return { error: orderError?.message || 'Impossible de créer la commande' };
  }

  // Insert order items
  const { error: itemsError } = await supabase.from('order_items').insert(
    orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_title_snapshot: item.product_title_snapshot,
      product_image_snapshot: item.product_image_snapshot,
      product_slug_snapshot: item.product_slug_snapshot,
      unit_price_at_order: item.unit_price_at_order,
      quantity: item.quantity,
    }))
  );

  if (itemsError) {
    return { error: itemsError.message };
  }

  // Send email
  sendCartOrderEmail({
    order_id: order.id,
    order_number: order.order_number,
    customer_name: input.customer_name,
    customer_phone: normalizedPhone,
    customer_city: customerCityName,
    customer_address: input.customer_address || null,
    customer_notes: input.customer_notes || null,
    items: orderItems.map((item) => ({
      product_title: item.product_title_snapshot,
      product_image: item.product_image_snapshot,
      quantity: item.quantity,
      unit_price: item.unit_price_at_order,
      discount_percent: item.discount_percent,
      discount_amount: item.discount_amount,
      line_total: item.line_total,
      currency,
    })),
    subtotal,
    total,
    currency,
    discount_total: totalDiscount,
  }).catch(() => {});

  revalidatePath('/[locale]/admin', 'page');
  revalidatePath('/[locale]/admin/orders', 'page');
  revalidateTag('orders', 'default');

  return { success: true, orderNumber: order.order_number, total, currency };
}
