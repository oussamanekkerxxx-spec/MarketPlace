'use client';

import { Link } from '@/lib/i18n/navigation';
import { ProductCard } from './ProductCard';
import { ArrowRight } from 'lucide-react';

interface ProductRowSectionProps {
  title: string;
  subtitle?: string | null;
  locale: string;
  products: Array<{
    id: string;
    slug: string;
    title_fr: string;
    title_en?: string | null;
    title_ar?: string | null;
    price: number;
    compare_at_price: number | null;
    currency: string;
    stock_quantity: number;
    track_inventory: boolean;
    low_stock_threshold: number;
  }>;
  productImages: Map<string, string>;
  primaryColor: string;
  codBadge: string;
  eyebrow?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  showDivider?: boolean;
}

export function ProductRowSection({
  title,
  subtitle,
  locale,
  products,
  productImages,
  primaryColor,
  codBadge,
  eyebrow,
  viewAllHref,
  viewAllLabel,
  showDivider = false,
}: ProductRowSectionProps) {
  if (products.length === 0) return null;

  return (
    <section className={`py-6 lg:py-8 ${showDivider ? 'border-t border-border-warm' : ''}`}>
      {/* Header — stays aligned with page content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary mb-2">
                {eyebrow}
              </p>
            )}
            <h2 className="text-xl lg:text-2xl font-bold text-secondary">
              {title}
            </h2>
            {subtitle && (
              <p className="text-sm text-text-muted mt-1">{subtitle}</p>
            )}
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref as '/'}
              className="inline-flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-opacity shrink-0"
              style={{ color: primaryColor }}
            >
              {viewAllLabel || 'Voir tout'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Horizontal scroll — full width so fade gradients sit at true screen edges */}
      <div className="relative">
        {/* Edge fade gradients — mobile only */}
        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-surface to-transparent z-10 pointer-events-none lg:hidden" />
        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-surface to-transparent z-10 pointer-events-none lg:hidden" />

        <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x snap-mandatory pb-2 px-4 sm:px-6 lg:px-8">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="shrink-0 w-[160px] sm:w-[200px] snap-start"
            >
              <ProductCard
                product={product}
                locale={locale}
                imageUrl={productImages.get(product.id)}
                primaryColor={primaryColor}
                codBadge={codBadge}
                priority={index < 2}
                sizes="200px"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
