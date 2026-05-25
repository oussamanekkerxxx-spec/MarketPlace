'use client';

import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { CheckCircle2 } from 'lucide-react';

interface ProductCardProps {
  product: {
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
  };
  locale: string;
  imageUrl?: string;
  primaryColor: string;
  codBadge: string;
  priority?: boolean;
  sizes?: string;
}

export function ProductCard({
  product,
  locale,
  imageUrl,
  primaryColor,
  codBadge,
  priority = false,
  sizes = '(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw',
}: ProductCardProps) {
  const title =
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
              alt={title}
              fill
              sizes={sizes}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              priority={priority}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-text-muted">
              {title.charAt(0)}
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
                  ? `Only ${product.stock_quantity} left`
                  : `تبقت ${product.stock_quantity}`}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-3 lg:p-4">
          <h3 className="text-sm font-semibold text-secondary line-clamp-2 break-words mb-1">
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
}
