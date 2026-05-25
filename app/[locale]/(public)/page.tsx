import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import {
  getSiteSettings,
  getCategories,
  getWhyUsItems,
  getHeroImages,
  getProductRows,
  getBestSellers,
  getProductsByRow,
} from '@/lib/cache/queries';
import { createClient } from '@/lib/supabase/server';
import { ScrollReveal } from '@/components/public/ScrollReveal';
import { HeroSlider } from '@/components/public/HeroSlider';
import { ProductRowSection } from '@/components/public/ProductRowSection';
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

  const [settings, categories, whyUsItems, heroImages, productRows, bestSellers] = await Promise.all([
    getSiteSettings(),
    getCategories(6),
    getWhyUsItems(),
    getHeroImages(),
    getProductRows(),
    getBestSellers(8),
  ]);

  // Fetch products for each row
  const rowProductsResults = await Promise.all(
    productRows.map((row) => getProductsByRow(row.id, 8))
  );

  // Collect all product IDs that need images
  const allProductIds = new Set<string>();
  for (const p of bestSellers) allProductIds.add(p.id);
  for (const rowProds of rowProductsResults) {
    for (const p of rowProds) allProductIds.add(p.id);
  }

  // Fetch images for ALL displayed products in one query
  let productImages: { product_id: string; url: string; is_primary: boolean }[] = [];
  if (allProductIds.size > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('product_images')
      .select('product_id, url, is_primary')
      .in('product_id', Array.from(allProductIds));
    productImages = data || [];
  }

  // Build image map: prefer primary image, fallback to first available
  const productImageMap = new Map<string, string>();
  for (const img of productImages) {
    const existing = productImageMap.get(img.product_id);
    if (!existing || img.is_primary) {
      productImageMap.set(img.product_id, img.url);
    }
  }

  const primaryColor = (settings?.primary_color as string) || '#FF6B35';
  const siteName = (settings?.site_name as string) || 'Boutique';

  const getLocalizedSetting = (baseKey: string): string => {
    const localized = settings?.[`${baseKey}_${locale}` as keyof typeof settings] as string | undefined;
    const fallback = settings?.[`${baseKey}_fr` as keyof typeof settings] as string | undefined;
    return localized || fallback || '';
  };

  const codBadge = getLocalizedSetting('cod_badge') || 'Paiement à la livraison';

  const heroTitleAccent = getLocalizedSetting('hero_title_accent');
  const heroEyebrow = getLocalizedSetting('hero_eyebrow');

  const heroSliderImages = heroImages.map((img) => ({ url: img.url, alt_text: img.alt_text }));
  const bestSellersTitle = locale === 'fr' ? 'Nos meilleures ventes' : locale === 'en' ? 'Best Sellers' : 'الأكثر مبيعاً';
  const bestSellersSubtitle = locale === 'fr' ? 'Les produits les plus populaires' : locale === 'en' ? 'Our most popular products' : 'منتجاتنا الأكثر شعبية';
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
        {/* Full-width hero image slider */}
        <HeroSlider
          images={heroSliderImages}
          fallbackAlt={heroTitleAccent || siteName}
          eyebrow={heroEyebrow}
        />


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
          PRODUCT SECTIONS — Unified block
          ============================================ */}
      <section className="bg-surface">
        <ScrollReveal>
          <ProductRowSection
            title={bestSellersTitle}
            subtitle={bestSellersSubtitle}
            locale={locale}
            products={bestSellers}
            productImages={productImageMap}
            primaryColor={primaryColor}
            codBadge={codBadge}
            eyebrow={t('featuredEyebrow')}
            viewAllHref="/category/all?sort=bestsellers"
            viewAllLabel={t('viewAll')}
          />
        </ScrollReveal>

        {productRows.map((row, rowIndex) => {
          const products = rowProductsResults[rowIndex] || [];
          const title =
            (row[`title_${locale}` as keyof typeof row] as string | null) || row.title_fr;
          const subtitle =
            (row[`subtitle_${locale}` as keyof typeof row] as string | null) || row.subtitle_fr;

          if (products.length === 0) return null;

          return (
            <ScrollReveal key={row.id}>
              <ProductRowSection
                title={title}
                subtitle={subtitle}
                locale={locale}
                products={products}
                productImages={productImageMap}
                primaryColor={primaryColor}
                codBadge={codBadge}
                viewAllHref={`/row/${row.slug}`}
                viewAllLabel={t('viewAll')}
                showDivider
              />
            </ScrollReveal>
          );
        })}
      </section>

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
      <div className="min-w-0">
        <p className="text-[11px] sm:text-sm font-semibold text-secondary leading-tight line-clamp-2">{title}</p>
        {subtitle && <p className="hidden sm:block text-xs text-text-muted mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
