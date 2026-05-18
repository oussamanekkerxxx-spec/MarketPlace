import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { notFound } from 'next/navigation';
import { getCategoryBySlug, getProductsByCategory, getSiteSettings } from '@/lib/cache/queries';
import { createClient } from '@/lib/supabase/server';
import { ScrollReveal } from '@/components/public/ScrollReveal';
import { SortDropdown } from '@/components/public/SortDropdown';
import { ChevronRight, CheckCircle2, LayoutGrid } from 'lucide-react';
import { Suspense } from 'react';
import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;

  if (slug === 'all') {
    const allLabels = {
      fr: 'Tous les produits',
      en: 'All products',
      ar: 'جميع المنتجات',
    };
    return { title: allLabels[locale as keyof typeof allLabels] || allLabels.fr };
  }

  const category = await getCategoryBySlug(slug);
  if (!category) {
    const notFoundLabels = {
      fr: 'Catégorie introuvable',
      en: 'Category not found',
      ar: 'الفئة غير موجودة',
    };
    return { title: notFoundLabels[locale as keyof typeof notFoundLabels] || notFoundLabels.fr };
  }

  const categoryName =
    (category[`name_${locale}` as keyof typeof category] as string | undefined) ||
    (category.name_fr as string);
  return { title: categoryName };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { slug, locale } = await params;
  const { sort } = await searchParams;

  let category: Record<string, unknown> | null = null;
  let products: {
    id: string;
    slug: string;
    title_fr: string;
    title_en?: string;
    title_ar?: string;
    price: number;
    compare_at_price: number | null;
    currency: string;
    stock_quantity: number;
    track_inventory: boolean;
    low_stock_threshold: number;
  }[] = [];

  if (slug === 'all') {
    products = await getProductsByCategory(null, 48);
  } else {
    category = await getCategoryBySlug(slug);
    if (!category) notFound();
    products = await getProductsByCategory(category.id as string, 48);
  }

  // Sort products
  const sortedProducts = [...products];
  if (sort === 'price-asc') {
    sortedProducts.sort((a, b) => a.price - b.price);
  } else if (sort === 'price-desc') {
    sortedProducts.sort((a, b) => b.price - a.price);
  }
  // default 'newest' is already ordered by created_at from the DB

  // Fetch images ONLY for displayed products (bounded)
  let productImages: { product_id: string; url: string }[] = [];
  if (sortedProducts.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from('product_images')
      .select('product_id, url')
      .eq('is_primary', true)
      .in('product_id', sortedProducts.map((p) => p.id));
    productImages = data || [];
  }

  const settings = await getSiteSettings();

  const productImageMap = new Map(productImages.map((img) => [img.product_id, img.url]));
  const primaryColor = (settings?.primary_color as string) || '#FF6B35';
  const codBadge = (settings?.[`cod_badge_${locale}` as keyof typeof settings] as string | undefined) || 'Paiement à la livraison';

  const categoryName = category
    ? ((category[`name_${locale}` as keyof typeof category] as string | undefined) || (category.name_fr as string))
    : 'Tous les produits';
  const categoryDescription = category
    ? (category[`description_${locale}` as keyof typeof category] as string | undefined) || (category.description_fr as string | undefined)
    : undefined;

  return (
    <div className="bg-background min-h-screen">
      {/* ============================================
          PAGE HERO
          ============================================ */}
      <section className="relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 moroccan-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <LayoutGrid className="w-5 h-5 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {category
                  ? locale === 'fr' ? 'Catégorie' : locale === 'en' ? 'Category' : 'الفئة'
                  : locale === 'fr' ? 'Catalogue' : locale === 'en' ? 'Catalog' : 'الكتالوج'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[1.1] tracking-tight text-white">
              {categoryName}
            </h1>
            {categoryDescription && (
              <p className="mt-4 text-base lg:text-lg text-white/70 max-w-lg leading-relaxed">
                {categoryDescription}
              </p>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-muted pt-6 pb-2">
          <Link href="/" className="hover:text-primary transition-colors">
            {locale === 'fr' ? 'Accueil' : locale === 'en' ? 'Home' : 'الرئيسية'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/category/all" className="hover:text-primary transition-colors">
            {locale === 'fr' ? 'Produits' : locale === 'en' ? 'Products' : 'المنتجات'}
          </Link>
          {category && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-secondary font-medium line-clamp-1">{categoryName}</span>
            </>
          )}
        </nav>

        {/* Toolbar */}
        <div className="flex items-center justify-between py-4 mb-4">
          <p className="text-sm text-text-muted">
            {sortedProducts.length} {locale === 'fr'
              ? `produit${sortedProducts.length !== 1 ? 's' : ''}`
              : locale === 'en'
              ? `product${sortedProducts.length !== 1 ? 's' : ''}`
              : 'منتج'}
          </p>
          <Suspense fallback={null}>
            <SortDropdown />
          </Suspense>
        </div>
      </div>

      {/* Products Grid */}
      {sortedProducts.length > 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {sortedProducts.map((product, index) => {
              const imageUrl = productImageMap.get(product.id);
              const productTitle =
                (product[`title_${locale}` as keyof typeof product] as string | undefined) ||
                product.title_fr;
              const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
              const savings = hasDiscount && product.compare_at_price
                ? Math.round(((product.compare_at_price - product.price) / product.compare_at_price) * 100)
                : 0;
              const isLowStock =
                product.track_inventory &&
                product.stock_quantity > 0 &&
                product.stock_quantity <= product.low_stock_threshold;

              return (
                <ScrollReveal key={product.id} delay={Math.min(index * 80, 400)}>
                  <Link
                    href={`/product/${product.slug}` as '/product/[slug]'}
                    className="group block"
                  >
                    <div className="relative rounded-xl overflow-hidden bg-surface-2 shadow-sm hover:shadow-md transition-shadow">
                      {/* Image */}
                      <div className="relative aspect-[4/5]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={productTitle}
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                            priority={index < 4}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-text-muted">
                            {productTitle.charAt(0)}
                          </div>
                        )}

                        {/* Savings badge */}
                        {hasDiscount && (
                          <span className="absolute top-2.5 left-2.5 bg-accent text-secondary text-[11px] font-bold px-2 py-1 rounded-full">
                            -{savings}%
                          </span>
                        )}

                        {/* Low stock overlay */}
                        {isLowStock && (
                          <span className="absolute bottom-2.5 left-2.5 bg-accent/90 text-white text-[11px] font-semibold px-2 py-1 rounded-full">
                            {locale === 'fr'
                              ? `Plus que ${product.stock_quantity} en stock`
                              : locale === 'en'
                              ? `Only ${product.stock_quantity} left in stock`
                              : `تبقت ${product.stock_quantity} فقط`}
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-3 lg:p-4">
                        <h3 className="text-sm font-semibold text-secondary line-clamp-2 mb-1">
                          {productTitle}
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
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mx-auto mb-4">
              <LayoutGrid className="w-8 h-8 text-text-muted" />
            </div>
            <p className="text-text-muted text-lg">
              {locale === 'fr'
                ? 'Aucun produit dans cette catégorie'
                : locale === 'en'
                ? 'No products in this category'
                : 'لا توجد منتجات في هذه الفئة'}
            </p>
            <Link
              href="/category/all"
              className="inline-block mt-4 font-semibold hover:opacity-80 transition-opacity"
              style={{ color: primaryColor }}
            >
              {locale === 'fr'
                ? 'Voir tous les produits'
                : locale === 'en'
                ? 'View all products'
                : 'عرض جميع المنتجات'}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
