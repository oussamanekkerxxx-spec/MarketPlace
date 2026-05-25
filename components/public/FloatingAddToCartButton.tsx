'use client';

import { Plus, Check } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '@/lib/cart/context';

interface FloatingAddToCartButtonProps {
  productId: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  image?: string | null;
  bulkDiscountThreshold?: number;
  bulkDiscountPercent?: number;
}

export function FloatingAddToCartButton({
  productId,
  slug,
  title,
  price,
  currency,
  image,
  bulkDiscountThreshold,
  bulkDiscountPercent,
}: FloatingAddToCartButtonProps) {
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

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white"
      style={{ bottom: 'calc(6rem + var(--sticky-bar-offset, 0px))' }}
      aria-label="Ajouter au panier"
    >
      {added ? (
        <Check className="w-5 h-5" />
      ) : (
        <Plus className="w-5 h-5" />
      )}
    </button>
  );
}
