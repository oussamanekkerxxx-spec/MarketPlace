'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart/context';

interface CartButtonProps {
  onClick: () => void;
}

export function CartButton({ onClick }: CartButtonProps) {
  const { itemCount } = useCart();

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-surface-2 transition-colors"
      aria-label="Panier"
    >
      <ShoppingCart className="w-5 h-5 text-secondary" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-white text-[11px] font-bold rounded-full px-1">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}
