'use client';

import { ShoppingCart, Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCart } from '@/lib/cart/context';

interface AddToCartButtonProps {
  productId: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  image?: string | null;
  bulkDiscountThreshold?: number;
  bulkDiscountPercent?: number;
  variant?: 'icon' | 'button';
}

export function AddToCartButton({
  productId,
  slug,
  title,
  price,
  currency,
  image,
  bulkDiscountThreshold,
  bulkDiscountPercent,
  variant = 'button',
}: AddToCartButtonProps) {
  const t = useTranslations('product');
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const handleClick = () => {
    addItem({
      productId,
      slug,
      title,
      price,
      currency,
      image,
      bulkDiscountThreshold,
      bulkDiscountPercent,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white transition-colors"
        aria-label={t('addToCart')}
      >
        {added ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <ShoppingCart className="h-4 w-4 text-secondary" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={added}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] ${
        added
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-secondary text-white hover:bg-secondary/90'
      }`}
    >
      {added ? (
        <>
          <Check className="h-4 w-4" />
          {t('added')}
        </>
      ) : (
        <>
          <ShoppingCart className="h-4 w-4" />
          {t('addToCart')}
        </>
      )}
    </button>
  );
}
