'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useCookieConsent } from './CookieConsent';

// Lazy-load MetaPixel — won't ship in the initial JS bundle.
// SSR disabled because the Pixel only matters in the browser anyway.
const MetaPixel = dynamic(() => import('./MetaPixel').then((m) => m.MetaPixel), {
  ssr: false,
});

export function MarketingConsentWrapper({
  pixelId,
  nonce,
}: {
  pixelId: string | null;
  nonce?: string | null;
}) {
  const { hasMarketingConsent } = useCookieConsent();
  const [idle, setIdle] = useState(false);

  // Defer mounting until browser is idle so the initial paint isn't blocked.
  // Falls back to setTimeout for browsers without requestIdleCallback (Safari).
  useEffect(() => {
    if (!pixelId || !hasMarketingConsent) return;

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };

    if (typeof win.requestIdleCallback === 'function') {
      const id = win.requestIdleCallback(() => setIdle(true), { timeout: 2000 });
      return () => {
        const winCancel = window as Window & {
          cancelIdleCallback?: (id: number) => void;
        };
        winCancel.cancelIdleCallback?.(id);
      };
    }

    const fallback = setTimeout(() => setIdle(true), 1500);
    return () => clearTimeout(fallback);
  }, [pixelId, hasMarketingConsent]);

  if (!hasMarketingConsent || !pixelId || !idle) return null;

  return <MetaPixel pixelId={pixelId} nonce={nonce} />;
}
