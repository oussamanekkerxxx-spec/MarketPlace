'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

export interface CartItem {
  productId: string;
  slug: string;
  title: string;
  price: number;
  currency: string;
  image?: string | null;
  quantity: number;
  bulkDiscountThreshold?: number;
  bulkDiscountPercent?: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  cartTotal: number;
  cartSubtotal: number;
  cartDiscount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = 'marketplace-cart';

function getDiscountedPrice(item: CartItem): number {
  if (
    item.bulkDiscountThreshold &&
    item.bulkDiscountPercent &&
    item.quantity >= item.bulkDiscountThreshold
  ) {
    return item.price * (1 - item.bulkDiscountPercent / 100);
  }
  return item.price;
}

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    /* ignore corrupt cart */
  }
  return [];
}

function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCart(items);
  }, [items, hydrated]);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'>) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === newItem.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === newItem.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const cartSubtotal = items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  const cartTotal = items.reduce(
    (sum, i) => sum + getDiscountedPrice(i) * i.quantity,
    0
  );

  const cartDiscount = cartSubtotal - cartTotal;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        cartTotal,
        cartSubtotal,
        cartDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
