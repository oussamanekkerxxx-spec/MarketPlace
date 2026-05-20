'use client';

import { useState } from 'react';
import { CartProvider } from '@/lib/cart/context';
import { CartButton } from './CartButton';
import { CartDrawer } from './CartDrawer';

interface CartShellProps {
  children: React.ReactNode;
  cities: Array<{ id: string; name_fr: string }>;
}

export function CartShell({ children, cities }: CartShellProps) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <CartProvider>
      {children}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-20">
        <CartButton onClick={() => setIsCartOpen(true)} />
      </div>
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cities={cities}
      />
    </CartProvider>
  );
}
