'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AdjacentProduct {
  slug: string;
  title_fr: string;
  title_en: string;
  title_ar: string;
}

interface ProductSwipeNavProps {
  locale: string;
  prevProduct: AdjacentProduct | null;
  nextProduct: AdjacentProduct | null;
  children: React.ReactNode;
}

export function ProductSwipeNav({ locale, prevProduct, nextProduct, children }: ProductSwipeNavProps) {
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [showHint, setShowHint] = useState<'left' | 'right' | null>(null);

  const navigateTo = useCallback(
    (slug: string) => {
      router.push(`/${locale}/product/${slug}`);
    },
    [router, locale]
  );

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const diffX = touchStartX.current - e.touches[0].clientX;
      const diffY = touchStartY.current - e.touches[0].clientY;

      // Only show hint for horizontal swipes (ignore vertical scrolling)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 30) {
        setShowHint(diffX > 0 ? 'right' : 'left');
      } else {
        setShowHint(null);
      }
    },
    []
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) {
        setShowHint(null);
        return;
      }

      const diffX = touchStartX.current - e.changedTouches[0].clientX;
      const diffY = touchStartY.current - e.changedTouches[0].clientY;

      touchStartX.current = null;
      touchStartY.current = null;
      setShowHint(null);

      // Ignore if it's primarily a vertical swipe
      if (Math.abs(diffY) > Math.abs(diffX)) return;

      const threshold = 60; // minimum horizontal swipe distance

      if (Math.abs(diffX) > threshold) {
        if (diffX > 0 && nextProduct) {
          // Swipe left → next product
          navigateTo(nextProduct.slug);
        } else if (diffX < 0 && prevProduct) {
          // Swipe right → previous product
          navigateTo(prevProduct.slug);
        }
      }
    },
    [navigateTo, prevProduct, nextProduct]
  );

  const hasNav = prevProduct || nextProduct;
  if (!hasNav) return <>{children}</>;

  return (
    <div
      className="relative touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}

      {/* Swipe hints — only on mobile */}
      {prevProduct && (
        <div
          className={`fixed left-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none transition-opacity duration-200 lg:hidden ${
            showHint === 'left' ? 'opacity-70' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          <div className="bg-black/60 text-white rounded-r-xl p-3 shadow-lg backdrop-blur-sm">
            <ChevronLeft className="w-7 h-7" />
          </div>
        </div>
      )}

      {nextProduct && (
        <div
          className={`fixed right-0 top-1/2 -translate-y-1/2 z-40 pointer-events-none transition-opacity duration-200 lg:hidden ${
            showHint === 'right' ? 'opacity-70' : 'opacity-0'
          }`}
          aria-hidden="true"
        >
          <div className="bg-black/60 text-white rounded-l-xl p-3 shadow-lg backdrop-blur-sm">
            <ChevronRight className="w-7 h-7" />
          </div>
        </div>
      )}
    </div>
  );
}
