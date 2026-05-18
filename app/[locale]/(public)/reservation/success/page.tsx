import { Link } from '@/lib/i18n/navigation';
import { getSiteSettings } from '@/lib/cache/queries';
import { createClient } from '@/lib/supabase/server';
import { PixelEvent } from '@/components/public/PixelEvent';
import { AnimatedCheckmark } from '@/components/public/AnimatedCheckmark';
import { getTranslations } from 'next-intl/server';
import { Phone, MessageCircle, ShoppingBag, ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'reservation' });
  return { title: t('successTitle') };
}

export default async function ReservationSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const { locale } = await params;
  const { order: orderNumber } = await searchParams;
  const t = await getTranslations({ locale, namespace: 'reservation' });

  const settingsRaw = await getSiteSettings();
  const supabase = await createClient();

  // Fetch order for pixel Purchase event
  const { data: orderRaw } = orderNumber
    ? await supabase
        .from('orders')
        .select('id, total, currency, order_items(product_id, product_title_snapshot, quantity, unit_price_at_order)')
        .eq('order_number', orderNumber)
        .single()
    : { data: null };

  const settings = settingsRaw as Record<string, unknown> | null;
  const thankYouMessage =
    (settings?.[`thank_you_message_${locale}` as keyof typeof settings] as string | undefined) ||
    (settings?.thank_you_message_fr as string) ||
    t('defaultThankYou');
  const whatsappNumber = settings?.whatsapp_number as string | null;
  const contactPhone = settings?.contact_phone as string | null;
  const primaryColor = (settings?.primary_color as string) || '#FF6B35';

  type OrderItemRow = {
    product_id: string;
    product_title_snapshot: string;
    quantity: number;
    unit_price_at_order: number;
  };
  type OrderRow = {
    id: string;
    total: number;
    currency: string;
    order_items: OrderItemRow[];
  };
  const order = orderRaw as OrderRow | null;

  const purchaseData = order
    ? {
        value: order.total,
        currency: order.currency,
        content_ids: order.order_items.map((item) => item.product_id),
        content_type: 'product',
        contents: order.order_items.map((item) => ({
          id: item.product_id,
          quantity: item.quantity,
          item_price: item.unit_price_at_order,
        })),
      }
    : undefined;

  const whatsappMessage = encodeURIComponent(
    `Bonjour, j'ai passé la commande ${orderNumber || ''}`
  );

  return (
    <>
      {purchaseData && (
        <PixelEvent
          eventName="Purchase"
          eventId={orderNumber ? `purchase-${orderNumber}` : undefined}
          eventData={purchaseData as Record<string, unknown>}
        />
      )}

      <div className="bg-background min-h-screen">
        {/* Breadcrumb */}
        <div className="max-w-xl mx-auto px-4 pt-6 pb-2">
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/" className="hover:text-primary transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-secondary font-medium">{t('successTitle')}</span>
          </nav>
        </div>

        <div className="max-w-xl mx-auto px-4 py-12 lg:py-20 text-center">
          <AnimatedCheckmark size={88} color={primaryColor} className="mb-6" />

          <h1 className="text-2xl sm:text-3xl font-bold text-secondary mb-3">
            {t('successTitle')}
          </h1>
          <p className="text-text-muted leading-relaxed mb-8 max-w-sm mx-auto">
            {thankYouMessage}
          </p>

          {orderNumber && (
            <div className="bg-surface rounded-xl border border-border-warm p-5 mb-8">
              <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-1">
                {t('orderNumber')}
              </p>
              <p className="text-2xl font-bold text-secondary tracking-tight">{orderNumber}</p>
            </div>
          )}

          <div className="space-y-3">
            {contactPhone && (
              <a
                href={`tel:${contactPhone}`}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-secondary text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <Phone className="w-4 h-4" />
                {t('callUs')}: {contactPhone}
              </a>
            )}
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-success text-white rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-4 h-4" />
                {t('contactWhatsApp')}
              </a>
            )}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 w-full py-3.5 border border-border-warm rounded-xl font-semibold text-secondary hover:bg-surface-2 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              {t('continueShopping')}
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
