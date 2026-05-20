'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { CartProvider, useCart } from '@/lib/cart/context';
import { CartDrawer } from './CartDrawer';

interface CartShellProps {
  children: React.ReactNode;
  cities: Array<{ id: string; name_fr: string }>;
}

function FloatingCartButton({ onClick }: { onClick: () => void }) {
  const { itemCount } = useCart();

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all bg-primary hover:opacity-90"
      aria-label="Panier"
    >
      <ShoppingCart className="w-7 h-7 text-white" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-accent text-white text-[11px] font-bold rounded-full px-1 shadow-md">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </button>
  );
}

export function CartShell({ children, cities }: CartShellProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      {children}
      <div
        className="fixed left-6 z-50 transition-[bottom] duration-300"
        style={{ bottom: 'calc(1.5rem + var(--sticky-bar-offset, 0px))' }}
      >
        <FloatingCartButton onClick={() => setIsCartOpen(true)} />
      </div>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cities={cities}
      />
    </CartProvider>
  );
}
