import { Link } from '@/lib/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { searchProducts } from '@/lib/cache/queries';
import { Search, PackageX, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'category' });
  return {
    title: t('search'),
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q } = await searchParams;
  const query = (q || '').trim();
  const tc = await getTranslations({ locale, namespace: 'category' });

  const results = query ? await searchProducts(query, 24) : [];

  const getTitle = (p: Record<string, unknown>) =>
    (p[`title_${locale}` as keyof typeof p] as string | undefined) ||
    (p.title_fr as string | undefined) ||
    '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[50vh]">
      {/* Search header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-secondary mb-2">
          {query ? `${tc('resultsFor')} « ${query} »` : tc('search')}
        </h1>
        {query && (
          <p className="text-sm text-text-muted">
            {results.length} {results.length === 1 ? tc('product') : tc('products')}
          </p>
        )}
      </div>

      {/* Empty state */}
      {query && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <PackageX className="w-16 h-16 text-text-muted/40 mb-4" />
          <h2 className="text-lg font-semibold text-secondary mb-1">
            {tc('noResults')}
          </h2>
          <p className="text-sm text-text-muted max-w-sm">
            {tc('noResultsDesc')}
          </p>
          <Link
            href="/category/all"
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-full transition-colors"
          >
            {tc('browseAll')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {results.map((product) => {
            const images = Array.isArray(product.product_images)
              ? (product.product_images as Array<{ url: string; is_primary: boolean }>)
              : [];
            const primaryImage = images.find((i) => i.is_primary)?.url || images[0]?.url;

            return (
              <Link
                key={product.id as string}
                href={`/product/${product.slug}` as '/product/[slug]'}
                className="group bg-surface border border-border-warm rounded-xl overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-surface-2 relative overflow-hidden">
                  {primaryImage ? (
                    <Image
                      src={primaryImage}
                      alt={getTitle(product)}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-text-muted">
                      {getTitle(product).charAt(0)}
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-text line-clamp-2 group-hover:text-primary transition-colors">
                    {getTitle(product)}
                  </h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm font-bold text-secondary">
                      {product.price} {product.currency}
                    </span>
                    {product.compare_at_price && (product.compare_at_price as number) > (product.price as number) && (
                      <span className="text-xs text-text-muted line-through">
                        {product.compare_at_price} {product.currency}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* No query yet */}
      {!query && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="w-16 h-16 text-text-muted/40 mb-4" />
          <h2 className="text-lg font-semibold text-secondary mb-1">
            {tc('startSearching')}
          </h2>
          <p className="text-sm text-text-muted max-w-sm">
            {tc('searchDesc')}
          </p>
        </div>
      )}
    </div>
  );
}
