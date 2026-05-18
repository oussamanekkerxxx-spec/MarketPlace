import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import {
  getSiteSettings,
  getFeaturedProducts,
  getCategories,
  getWhyUsItems,
} from '@/lib/cache/queries';
import { createClient } from '@/lib/supabase/server';
import { ScrollReveal } from '@/components/public/ScrollReveal';
import {
  Truck,
  Banknote,
  ShieldCheck,
  Package,
  Clock,
  RotateCcw,
  BadgeCheck,
  Lock,
  Headphones,
  MapPin,
  Star,
  ThumbsUp,
  Zap,
  Heart,
  Award,
  CheckCircle2,
  Hammer,
  Leaf,
  ArrowRight,
} from 'lucide-react';

export const revalidate = 60;

const whyUsIcons = [Hammer, Leaf, Truck, RotateCcw];

/* Dynamic icon map for trust strip — admin picks name, we render component */
const trustIconMap: Record<string, React.ElementType> = {
  Truck,
  Banknote,
  ShieldCheck,
  Package,
  Clock,
  RotateCcw,
  BadgeCheck,
  Lock,
  Headphones,
  MapPin,
  Star,
  ThumbsUp,
  Zap,
  Heart,
  Award,
};

function getTrustIcon(name: string | undefined): React.ElementType {
  return trustIconMap[name || ''] || Truck;
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  const [settings, featuredProducts, categories, whyUsItems] = await Promise.all([
    getSiteSettings(),
    getFeaturedProducts(8),
    getCategories(6),
    getWhyUsItems(),
  ]);

  // Fetch images ONLY for the featured products (bounded)
  let productImages: { product_id: string; url: string }[] = [];
  if (featuredProducts.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('product_images')
      .select('product_id, url')
      .eq('is_primary', true)
      .in('product_id', featuredProducts.map((p) => p.id));
    productImages = data || [];
  }

  const productImageMap = new Map(productImages.map((img) => [img.product_id, img.url]));
  const getProductImage = (productId: string) => productImageMap.get(productId);

  const primaryColor = (settings?.primary_color as string) || '#FF6B35';
  const siteName = (settings?.site_name as string) || 'Boutique';

  const getLocalizedSetting = (baseKey: string): string => {
    const localized = settings?.[`${baseKey}_${locale}` as keyof typeof settings] as string | undefined;
    const fallback = settings?.[`${baseKey}_fr` as keyof typeof settings] as string | undefined;
    return localized || fallback || '';
  };

  const codBadge = getLocalizedSetting('cod_badge') || 'Paiement à la livraison';

  const isRTL = locale === 'ar';

  const heroEyebrow = getLocalizedSetting('hero_eyebrow');
  const heroTitleAccent = getLocalizedSetting('hero_title_accent');
  const heroTitleMain = getLocalizedSetting('hero_title_main');
  const heroSubtitle = getLocalizedSetting('hero_subtitle');
  const heroImageUrl = settings?.hero_image_url as string | undefined;
  const featuredSectionTitle = getLocalizedSetting('featured_section_title');
  const featuredSectionSubtitle = getLocalizedSetting('featured_section_subtitle');
  const whyUsTitle = getLocalizedSetting('why_us_title');
  const whyUsSub = getLocalizedSetting('why_us_sub');
  const showWhyUs = !!(whyUsTitle && whyUsSub);

  // Trust strip
  const trust1Title = getLocalizedSetting('trust_1_title');
  const trust1Sub = getLocalizedSetting('trust_1_sub');
  const trust1Icon = getTrustIcon(settings?.trust_1_icon as string | undefined);
  const trust2Title = getLocalizedSetting('trust_2_title');
  const trust2Sub = getLocalizedSetting('trust_2_sub');
  const trust2Icon = getTrustIcon(settings?.trust_2_icon as string | undefined);
  const trust3Title = getLocalizedSetting('trust_3_title');
  const trust3Sub = getLocalizedSetting('trust_3_sub');
  const trust3Icon = getTrustIcon(settings?.trust_3_icon as string | undefined);
  const showTrustStrip = !!(trust1Title || trust2Title || trust3Title);

  return (
    <div>
      {/* ============================================
          HERO — Full-width image + dark text band
          ============================================ */}
      <section className="relative bg-secondary">
        {/* Full-width hero image */}
        <div className="relative w-full h-[45vh] sm:h-[50vh] lg:h-[55vh]">
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt={heroTitleAccent || siteName}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary to-secondary/70" />
          )}
          {/* Subtle bottom gradient for smooth transition to text band */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-secondary to-transparent" />
        </div>

        {/* Dark text band */}
        <div className="relative">
          {/* Moroccan pattern overlay (subtle) */}
          <div className="absolute inset-0 moroccan-pattern opacity-20" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
            <div className="max-w-2xl">
              {heroEyebrow && (
                <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="w-8 h-px bg-accent" />
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                    {heroEyebrow}
                  </span>
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[1.1] tracking-tight text-white mb-5">
                {heroTitleAccent && (
                  <span className="text-primary">{heroTitleAccent}</span>
                )}
                {heroTitleAccent && heroTitleMain && ' '}
                {heroTitleMain && (
                  <span className="text-white/90">{heroTitleMain}</span>
                )}
              </h1>
              {heroSubtitle && (
                <p className="text-base lg:text-lg text-white/70 max-w-md mb-8 leading-relaxed whitespace-pre-line">
                  {heroSubtitle}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/category/all"
                  className="inline-flex items-center gap-2 px-6 py-3.5 text-white text-sm font-semibold rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: primaryColor }}
                >
                  {t('shopNow')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/category/all"
                  className="inline-flex items-center px-6 py-3.5 text-sm font-semibold text-white border border-white/30 rounded-full hover:bg-white/10 transition-colors"
                >
                  {t('seeProducts')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          TRUST STRIP — Card tiles
          ============================================ */}
      {showTrustStrip && (
        <ScrollReveal>
          <section className="bg-background py-6 lg:py-10">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {trust1Title && (
                  <TrustCard
                    icon={trust1Icon}
                    title={trust1Title}
                    subtitle={trust1Sub}
                    primaryColor={primaryColor}
                  />
                )}
                {trust2Title && (
                  <TrustCard
                    icon={trust2Icon}
                    title={trust2Title}
                    subtitle={trust2Sub}
                    primaryColor={primaryColor}
                  />
                )}
                {trust3Title && (
                  <TrustCard
                    icon={trust3Icon}
                    title={trust3Title}
                    subtitle={trust3Sub}
                    primaryColor={primaryColor}
                  />
                )}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ============================================
          CATEGORIES — Horizontal Scroll Strip
          ============================================ */}
      {categories.length > 0 && (
        <ScrollReveal>
          <section className="py-10 lg:py-14 bg-background">
            {/* Title stays inside the padded container */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-secondary">{t('categories')}</h2>
            </div>
            {/* Fade wrapper is full-width so gradients sit at the true screen edges */}
            <div className="relative">
              {/* Edge fade gradients — mobile scroll only, hidden on desktop */}
              <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none lg:hidden" />
              <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none lg:hidden" />
              <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2 px-4 sm:px-6 lg:px-8 stagger-children lg:overflow-visible lg:justify-center lg:flex-wrap">
                {categories.map((cat) => {
                  const name = (cat[`name_${locale}` as keyof typeof cat] as string | null) || cat.name_fr;
                  return (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}` as '/category/[slug]'}
                      className="group shrink-0 w-[140px] sm:w-[160px] snap-start"
                    >
                      <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                        {cat.image_url ? (
                          <Image
                            src={cat.image_url}
                            alt={name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="160px"
                          />
                        ) : (
                          <div className="w-full h-full bg-surface-2 flex items-center justify-center text-3xl font-bold text-text-muted">
                            {name.charAt(0)}
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-sm font-semibold text-white text-center">{name}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}

      {/* ============================================
          FEATURED PRODUCTS
          ============================================ */}
      <ScrollReveal>
        <section className="py-10 lg:py-14 bg-surface">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-2">
                  {t('featuredEyebrow')}
                </p>
                <h2 className="text-xl lg:text-2xl font-bold text-secondary">
                  {featuredSectionTitle || t('featuredTitle')}
                </h2>
                {featuredSectionSubtitle && (
                  <p className="text-sm text-text-muted mt-1">{featuredSectionSubtitle}</p>
                )}
              </div>
              <Link
                href="/category/all"
                className="text-sm font-medium hover:opacity-80 transition-opacity"
                style={{ color: primaryColor }}
              >
                {t('viewAll')}
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5 stagger-children">
              {featuredProducts.map((product, index) => {
                const imageUrl = getProductImage(product.id);
                const title =
                  (product[`title_${locale}` as keyof typeof product] as string | null) ||
                  product.title_fr;
                const hasDiscount =
                  product.compare_at_price && product.compare_at_price > product.price;
                const savings = hasDiscount
                  ? Math.round(
                      ((product.compare_at_price - product.price) / product.compare_at_price) * 100,
                    )
                  : 0;
                const isLowStock =
                  product.track_inventory &&
                  product.stock_quantity > 0 &&
                  product.stock_quantity <= product.low_stock_threshold;

                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}` as '/product/[slug]'}
                    className="group block"
                  >
                    <div className="relative rounded-xl overflow-hidden bg-surface-2 shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative aspect-[4/5]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            priority={index < 2}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-text-muted">
                            {title.charAt(0)}
                          </div>
                        )}
                        {hasDiscount && (
                          <span className="absolute top-2.5 left-2.5 bg-accent text-secondary text-[11px] font-bold px-2 py-1 rounded-full">
                            -{savings}%
                          </span>
                        )}
                        {isLowStock && (
                          <span className="absolute bottom-2.5 left-2.5 bg-accent/90 text-white text-[11px] font-semibold px-2 py-1 rounded-full">
                            {t('lowStockOverlay', { count: product.stock_quantity })}
                          </span>
                        )}
                      </div>
                      <div className="p-3 lg:p-4">
                        <h3 className="text-sm font-semibold text-secondary line-clamp-2 mb-1">
                          {title}
                        </h3>
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-base font-bold" style={{ color: primaryColor }}>
                            {product.price} {product.currency}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-text-muted line-through">
                              {product.compare_at_price} {product.currency}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 inline-flex items-center gap-1 text-xs text-success font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {codBadge}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {featuredProducts.length === 0 && (
              <div className="text-center py-12 text-text-muted">{t('noFeaturedProducts')}</div>
            )}
          </div>
        </section>
      </ScrollReveal>

      {/* ============================================
          WHY US
          ============================================ */}
      {whyUsItems.length > 0 && (
        <ScrollReveal>
          <section className="py-14 lg:py-20 bg-surface-2">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-2">
                  {t('whyUsEyebrow')}
                </p>
                <h2 className="text-xl lg:text-2xl font-bold text-secondary">
                  {whyUsTitle || t('whyUsTitle')}
                </h2>
                <p className="text-text-muted mt-2 max-w-lg mx-auto text-sm lg:text-base">
                  {whyUsSub || t('whyUsSubtitle')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
                {whyUsItems.map((item, i) => {
                  const itemTitle =
                    (item[`title_${locale}` as keyof typeof item] as string | null) || item.title_fr;
                  const itemText =
                    (item[`text_${locale}` as keyof typeof item] as string | null) || item.text_fr;
                  const itemLabel =
                    (item[`number_label_${locale}` as keyof typeof item] as string | null) ||
                    item.number_label_fr ||
                    String(i + 1).padStart(2, '0');
                  const Icon = whyUsIcons[i % whyUsIcons.length];

                  return (
                    <div
                      key={item.id}
                      className="relative bg-surface rounded-xl p-6 border border-border-warm overflow-hidden"
                    >
                      <span
                        className="absolute -top-2 -right-2 text-7xl font-bold leading-none select-none pointer-events-none"
                        style={{ color: `${primaryColor}15` }}
                      >
                        {itemLabel}
                      </span>
                      <div className="relative">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                          style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-semibold text-secondary mb-1.5">{itemTitle}</h3>
                        <p className="text-sm text-text-muted leading-relaxed">{itemText}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        </ScrollReveal>
      )}
    </div>
  );
}

/* ============================================
   Sub-components
   ============================================ */

function TrustCard({
  icon: Icon,
  title,
  subtitle,
  primaryColor,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  primaryColor: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 p-3 sm:p-5 rounded-xl bg-surface border border-border-warm text-center sm:text-start">
      <div
        className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${primaryColor}12`, color: primaryColor }}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <div>
        <p className="text-[11px] sm:text-sm font-semibold text-secondary leading-tight line-clamp-2">{title}</p>
        {subtitle && <p className="hidden sm:block text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
