import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ReservationForm } from '@/components/public/ReservationForm';
import { FloatingAddToCartButton } from '@/components/public/FloatingAddToCartButton';
import { PixelEvent } from '@/components/public/PixelEvent';
import { ProductGallery } from '@/components/public/ProductGallery';
import { ScrollReveal } from '@/components/public/ScrollReveal';
import { MobileStickyOrderBar } from '@/components/public/MobileStickyOrderBar';
import { ProductSwipeNav } from '@/components/public/ProductSwipeNav';
import { GoogleProductView } from '@/components/public/GoogleProductView';
import { ProductNarrative } from '@/components/public/ProductNarrative';
import { sendCapiEventServerSide } from '@/lib/facebook/capi-server';
import type { DetailSectionFormData } from '@/lib/validation/product';
import {
  getProductBySlug,
  getProductImages,
  getSimilarProducts,
  getSiteSettings,
  getAdjacentProducts,
} from '@/lib/cache/queries';
import { sanitizeHtml } from '@/lib/utils/sanitize-html';
import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import {
  CheckCircle2,
  Package,
  PackageX,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Tag,
  ChevronRight,
} from 'lucide-react';
import type { Metadata } from 'next';

// export const revalidate = 60; // temporarily disabled to rule out caching issues

function getLocalized(
  product: Record<string, unknown>,
  field: string,
  locale: string
): string {
  return (
    (product[`${field}_${locale}`] as string | undefined) ||
    (product[`${field}_fr`] as string | undefined) ||
    ''
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shahdmall.com';
  const product = await getProductBySlug(slug);

  if (!product) {
    const tMeta = await getTranslations({ locale, namespace: 'metadata' });
    return {
      title: tMeta('productNotFound'),
      alternates: {
        canonical: `${siteUrl}/${locale}/product/${slug}`,
        languages: {
          fr: `${siteUrl}/fr/product/${slug}`,
          en: `${siteUrl}/en/product/${slug}`,
          ar: `${siteUrl}/ar/product/${slug}`,
        },
      },
    };
  }

  const title = getLocalized(product, 'meta_title', locale) || getLocalized(product, 'title', locale);
  const description = getLocalized(product, 'meta_description', locale) || getLocalized(product, 'short_description', locale);

  const images = await getProductImages(product.id as string);
  const primaryImage = images.find((i) => i.is_primary)?.url || images[0]?.url;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: primaryImage ? [{ url: primaryImage, width: 1200, height: 630 }] : undefined,
      locale,
      url: `${siteUrl}/${locale}/product/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: primaryImage ? [primaryImage] : undefined,
    },
    alternates: {
      canonical: `${siteUrl}/${locale}/product/${slug}`,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;

  try {
    const product = await getProductBySlug(slug);
    if (!product) {
      notFound();
    }

    // Parallelize all independent data fetches
    const [productImages, settings] = await Promise.all([
      getProductImages(product.id as string),
      getSiteSettings(),
    ]);

    // Related products with their primary image (single joined query — no N+1)
    const categoryId = product.category_id as string | null;
    const [similarProducts, adjacentProducts] = await Promise.all([
      getSimilarProducts(categoryId, product.id as string, 4),
      getAdjacentProducts(product.id as string, product.created_at as string, categoryId),
    ]);

  type RelatedImage = { url: string; is_primary: boolean };
  const similarImageMap = new Map<string, string>();
  for (const rp of similarProducts as Array<{ id: string; product_images?: RelatedImage[] }>) {
    const imgs = rp.product_images || [];
    const primary = imgs.find((i) => i.is_primary) || imgs[0];
    if (primary) similarImageMap.set(rp.id, primary.url);
  }

  const primaryColor = (settings?.primary_color as string) || '#FF6B35';
  const whatsappNumber = settings?.whatsapp_number as string | null;

  const getLocalizedSetting = (baseKey: string): string => {
    const localized = settings?.[`${baseKey}_${locale}` as keyof typeof settings] as string | undefined;
    const fallback = settings?.[`${baseKey}_fr` as keyof typeof settings] as string | undefined;
    return localized || fallback || '';
  };

  const t = await getTranslations({ locale, namespace: 'product' });
  const tNav = await getTranslations({ locale, namespace: 'navigation' });
  const tRes = await getTranslations({ locale, namespace: 'reservation' });
  const codBadge = getLocalizedSetting('cod_badge') || t('codBadge');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shahdmall.com';

  const title = getLocalized(product, 'title', locale);
  const shortDescription = getLocalized(product, 'short_description', locale);
  const description = getLocalized(product, 'description', locale);
  const safeDescription = description ? sanitizeHtml(description) : '';

  const images = productImages.map((img) => img.url).filter((u): u is string => !!u);
  const sections = (product.detail_sections as DetailSectionFormData[] | null) || [];

  // Category data from the joined categories table
  const categoryData = product.categories as Record<string, string> | null;
  const categoryName = categoryData
    ? (categoryData[`name_${locale}` as keyof typeof categoryData] as string | undefined) || categoryData.name_fr
    : null;
  const categorySlug = categoryData?.slug;

  const attributes = product.attributes as { features_fr?: string[]; features_en?: string[]; features_ar?: string[] } | null;
  const features = attributes?.[`features_${locale}` as keyof typeof attributes] || attributes?.features_fr || [];
  const hasFeatures = features.length > 0;

  const price = product.price as number;
  const compareAtPrice = product.compare_at_price as number | null;
  const currency = product.currency as string;
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const savings = hasDiscount ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

  // Product-aware WhatsApp message for the sticky bar
  const productUrl = `${siteUrl}/${locale}/product/${slug}`;
  const defaultMsg = getLocalizedSetting('whatsapp_default_message');
  const whatsappMessage = defaultMsg || (() => {
    switch (locale) {
      case 'en': return `Hello, I am interested in this product:\n\n${title}\nPrice: ${price} ${currency}\n\n${productUrl}`;
      case 'ar': return `مرحباً، أنا مهتم بهذا المنتج:\n\n${title}\nالسعر: ${price} ${currency}\n\n${productUrl}`;
      default: return `Bonjour, je suis intéressé(e) par ce produit :\n\n${title}\nPrix : ${price} ${currency}\n\n${productUrl}`;
    }
  })();

  const stockQty = product.stock_quantity as number;
  const trackInventory = product.track_inventory as boolean;
  const lowStockThreshold = product.low_stock_threshold as number;
  const isInStock = stockQty > 0;
  const isLowStock = trackInventory && isInStock && stockQty <= lowStockThreshold;

  // Server-side CAPI ViewContent (catches iOS 14.5+ blocked browsers)
  // We use the server-side helper directly (not the 'use server' action)
  // to avoid Next.js 16 request-scope issues with floating promises.
  const viewContentEventId = `viewcontent-${product.id as string}`;
  sendCapiEventServerSide({
    eventName: 'ViewContent',
    eventId: viewContentEventId,
    customData: {
      content_ids: [product.id as string],
      content_type: 'product',
      content_name: title,
      value: price,
      currency: currency,
    },
  }).catch(() => {});

  const prevProduct = adjacentProducts.prev as { slug: string; title_fr: string; title_en: string; title_ar: string } | null;
  const nextProduct = adjacentProducts.next as { slug: string; title_fr: string; title_en: string; title_ar: string } | null;

  return (
    <ProductSwipeNav locale={locale} prevProduct={prevProduct} nextProduct={nextProduct}>
      <PixelEvent
        eventName="ViewContent"
        eventId={viewContentEventId}
        eventData={{
          content_ids: [product.id as string],
          content_type: 'product',
          content_name: title,
          value: price,
          currency: currency,
        }}
      />
      {/* JSON-LD structured data for Google rich results */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'Product',
              name: title,
              description: shortDescription || description,
              image: images.length > 0 ? images : undefined,
              sku: (product.sku as string) || undefined,
              brand: {
                '@type': 'Brand',
                name: (settings?.site_name as string) || 'Boutique',
              },
              offers: {
                '@type': 'Offer',
                url: `${siteUrl}/${locale}/product/${slug}`,
                priceCurrency: currency,
                price: price.toString(),
                availability: isInStock
                  ? 'https://schema.org/InStock'
                  : 'https://schema.org/OutOfStock',
              },
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: tNav('home'),
                  item: `${siteUrl}/${locale}`,
                },
                ...(categorySlug && categoryName
                  ? [{
                      '@type': 'ListItem',
                      position: 2,
                      name: categoryName,
                      item: `${siteUrl}/${locale}/category/${categorySlug}`,
                    }, {
                      '@type': 'ListItem',
                      position: 3,
                      name: title,
                      item: `${siteUrl}/${locale}/product/${slug}`,
                    }]
                  : [{
                      '@type': 'ListItem',
                      position: 2,
                      name: tNav('products'),
                      item: `${siteUrl}/${locale}/category/all`,
                    }, {
                      '@type': 'ListItem',
                      position: 3,
                      name: title,
                      item: `${siteUrl}/${locale}/product/${slug}`,
                    }]),
              ],
            },
          ],
        })}
      </script>

      <GoogleProductView
        productId={product.id as string}
        productName={title}
        price={price}
        currency={currency}
      />
      {/* Hidden product data for SmartWhatsAppButton */}
      <div
        id="product-whatsapp-data"
        data-title={title}
        data-price={price}
        data-currency={currency}
        data-url={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shahdmall.com'}/${locale}/product/${slug}`}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <div className="bg-background min-h-screen">
        {/* ============================================
            BREADCRUMB
            ============================================ */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
          <nav className="flex items-center gap-2 text-sm text-text-muted">
            <Link href="/" className="hover:text-primary transition-colors">
              {tNav('home')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            {categorySlug && categoryName ? (
              <>
                <Link href={`/category/${categorySlug}` as '/category/[slug]'} className="hover:text-primary transition-colors">
                  {categoryName}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Link href="/category/all" className="hover:text-primary transition-colors">
                  {tNav('products')}
                </Link>
                <ChevronRight className="w-3.5 h-3.5" />
              </>
            )}
            <span className="text-secondary font-medium line-clamp-1">{title}</span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* ============================================
                LEFT — IMAGE GALLERY
                ============================================ */}
            <ScrollReveal>
              <ProductGallery images={images} alt={title} />
            </ScrollReveal>

            {/* ============================================
                RIGHT — PRODUCT INFO (sticky on desktop)
                ============================================ */}
            <div className="lg:sticky lg:top-24 lg:self-start space-y-5">
              <ScrollReveal>
                {/* Category eyebrow */}
                {categoryName && categorySlug && (
                  <Link
                    href={`/category/${categorySlug}` as '/category/[slug]'}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-primary hover:underline"
                  >
                    {categoryName}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-secondary leading-tight mt-1">
                  {title}
                </h1>

                {/* SKU */}
                {Boolean(product.sku) && (
                  <p className="text-xs text-text-muted mt-1">
                    {t('sku', { sku: product.sku as string })}
                  </p>
                )}

                {/* Price row */}
                <div className="flex items-center gap-3 flex-wrap pt-2">
                  <span className="text-3xl font-bold text-primary">
                    {price} {currency}
                  </span>
                  {hasDiscount && (
                    <>
                      <span className="text-xl text-text-muted line-through">
                        {compareAtPrice} {currency}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/10 text-accent text-sm font-bold rounded-full">
                        <Tag className="w-3.5 h-3.5" />
                        {t('save')} {savings}%
                      </span>
                    </>
                  )}
                </div>

                {/* Bulk discount badge */}
                {(product.bulk_discount_threshold as number | null) && (product.bulk_discount_percent as number | null) && (
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-semibold">
                      <Tag className="w-3.5 h-3.5" />
                      {t('bulkDiscount', { percent: product.bulk_discount_percent as number, threshold: product.bulk_discount_threshold as number })}
                    </span>
                  </div>
                )}

                {/* Stock + COD badges */}
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {isInStock ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-success/10 text-success rounded-full text-sm font-medium">
                      <Package className="w-3.5 h-3.5" />
                      {t('inStock')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium">
                      <PackageX className="w-3.5 h-3.5" />
                      {t('outOfStock')}
                    </span>
                  )}
                  {isLowStock && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {t('lowStock', { count: stockQty })}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {codBadge}
                  </span>
                </div>

                {/* Short description */}
                {shortDescription && (
                  <p className="text-text-muted leading-relaxed">{shortDescription}</p>
                )}

                {/* Features */}
                {hasFeatures && (
                  <div>
                    <h3 className="text-sm font-semibold text-secondary mb-2.5">{t('features')}</h3>
                    <ul className="space-y-2">
                      {features.map((bullet, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </ScrollReveal>

              {/* ============================================
                  RESERVATION FORM
                  ============================================ */}
              <ScrollReveal delay={150}>
                <div id="reservation-form" className="bg-surface rounded-2xl border border-border-warm p-5 sm:p-6 shadow-sm scroll-mt-24">
                  <h2 className="text-lg font-bold text-secondary mb-4">
                    {tRes('title')}
                  </h2>
                  <div className="border-t border-border-warm pt-4">
                    <ReservationForm
                      productId={product.id as string}
                      productPrice={price}
                      productCurrency={currency}
                      trustLine={codBadge}
                      bulkDiscountThreshold={product.bulk_discount_threshold as number | undefined}
                      bulkDiscountPercent={product.bulk_discount_percent as number | undefined}
                    />
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>

          {/* ============================================
              SEPARATOR + DESCRIPTION
              ============================================ */}
          {safeDescription && (
            <>
              <div className="my-12 lg:my-16 border-t border-border-warm" />
              <ScrollReveal>
                <div className="min-w-0">
                  <h2 className="text-xl lg:text-2xl font-bold text-secondary mb-4">
                    {t('description')}
                  </h2>
                  <div
                    className="rich-text-content max-w-none min-w-0"
                    dangerouslySetInnerHTML={{ __html: safeDescription }}
                  />
                </div>
              </ScrollReveal>
            </>
          )}

          {/* ============================================
              NARRATIVE SECTIONS — scroll-driven storytelling
              ============================================ */}
          {sections.length > 0 && (
            <>
              <div className="my-12 lg:my-16 border-t border-border-warm" />
              <ProductNarrative sections={sections} locale={locale} />
            </>
          )}

          {/* ============================================
              PRODUITS SIMILAIRES
              ============================================ */}
          {similarProducts.length > 0 && (
            <>
              <div className="my-12 lg:my-16 border-t border-border-warm" />
              <ScrollReveal>
                <div>
                  <div className="flex items-end justify-between mb-6">
                    <h2 className="text-xl lg:text-2xl font-bold text-secondary">
                      {t('youMayAlsoLike')}
                    </h2>
                    <Link
                      href={categorySlug ? `/category/${categorySlug}` as '/category/[slug]' : '/category/all'}
                      className="text-sm font-medium hover:opacity-80 transition-opacity"
                      style={{ color: primaryColor }}
                    >
                      {t('seeMore')}
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                    {(similarProducts as Array<{ id: string; slug: string; title_fr: string; price: number; compare_at_price: number | null; currency: string; stock_quantity: number; track_inventory: boolean; low_stock_threshold: number }>).map((rp) => {
                      const imgUrl = similarImageMap.get(rp.id);
                      const rpTitle = (rp[`title_${locale}` as keyof typeof rp] as string | null) || rp.title_fr;
                      const rpCompareAtPrice = rp.compare_at_price;
                      const rpHasDiscount = rpCompareAtPrice && rpCompareAtPrice > rp.price;
                      const rpSavings = rpHasDiscount && rpCompareAtPrice
                        ? Math.round(((rpCompareAtPrice - rp.price) / rpCompareAtPrice) * 100)
                        : 0;
                      const rpIsLowStock =
                        rp.track_inventory &&
                        rp.stock_quantity > 0 &&
                        rp.stock_quantity <= rp.low_stock_threshold;

                      return (
                        <Link
                          key={rp.id}
                          href={`/product/${rp.slug}` as '/product/[slug]'}
                          className="group block"
                        >
                          <div className="relative rounded-xl overflow-hidden bg-surface-2 shadow-sm hover:shadow-md transition-shadow">
                            {/* Image */}
                            <div className="relative aspect-[4/5]">
                              {imgUrl ? (
                                <Image
                                  src={imgUrl}
                                  alt={rpTitle}
                                  fill
                                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-text-muted">
                                  {rpTitle.charAt(0)}
                                </div>
                              )}

                              {/* Savings badge */}
                              {rpHasDiscount && (
                                <span className="absolute top-2.5 left-2.5 bg-accent text-secondary text-[11px] font-bold px-2 py-1 rounded-full">
                                  -{rpSavings}%
                                </span>
                              )}

                              {/* Low stock overlay */}
                              {rpIsLowStock && (
                                <span className="absolute bottom-2.5 left-2.5 bg-accent/90 text-white text-[11px] font-semibold px-2 py-1 rounded-full">
                                  {t('lowStock', { count: rp.stock_quantity })}
                                </span>
                              )}
                            </div>

                            {/* Body */}
                            <div className="p-3 lg:p-4">
                              <h3 className="text-sm font-semibold text-secondary line-clamp-2 mb-1">
                                {rpTitle}
                              </h3>
                              <div className="flex items-baseline gap-2 flex-wrap">
                                <span className="text-base font-bold" style={{ color: primaryColor }}>
                                  {rp.price} {rp.currency}
                                </span>
                                {rpHasDiscount && (
                                  <span className="text-xs text-text-muted line-through">
                                    {rpCompareAtPrice} {rp.currency}
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
                </div>
              </ScrollReveal>
            </>
          )}
        </div>
      </div>

      <FloatingAddToCartButton
        productId={product.id as string}
        slug={slug}
        title={title}
        price={price}
        currency={currency}
        image={images[0] || null}
        bulkDiscountThreshold={product.bulk_discount_threshold as number | undefined}
        bulkDiscountPercent={product.bulk_discount_percent as number | undefined}
      />

      <MobileStickyOrderBar
        price={price}
        compareAtPrice={compareAtPrice}
        currency={currency}
        formAnchorId="reservation-form"
        inStock={isInStock}
        productImage={images[0] || null}
        productTitle={title}
        whatsappNumber={whatsappNumber}
        whatsappMessage={whatsappMessage}
      />
    </ProductSwipeNav>
  );
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[ProductPage] Render error:', {
      slug,
      locale,
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}
