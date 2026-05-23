'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useCookieConsent } from './CookieConsent';

// Lazy-load MetaPixel — won't ship in the initial JS bundle.
// SSR disabled because the Pixel only matters in the browser anyway.
const MetaPixel = dynamic(() => import('./MetaPixel').then((m) => m.MetaPixel), {
  ssr: false,
});

const GoogleTracking = dynamic(() => import('./GoogleTracking').then((m) => m.GoogleTracking), {
  ssr: false,
});

export function MarketingConsentWrapper({
  pixelId,
  gaId,
  adsId,
  adsConversionLabel,
}: {
  pixelId: string | null;
  gaId: string | null;
  adsId: string | null;
  adsConversionLabel: string | null;
}) {
  const { hasMarketingConsent } = useCookieConsent();
  const [idle, setIdle] = useState(false);

  const hasTracking = Boolean(pixelId || gaId || adsId);

  // Defer mounting until browser is idle so the initial paint isn't blocked.
  // Falls back to setTimeout for browsers without requestIdleCallback (Safari).
  useEffect(() => {
    if (!hasTracking || !hasMarketingConsent) return;

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
  }, [hasTracking, hasMarketingConsent]);

  if (!hasMarketingConsent || !hasTracking || !idle) return null;

  return (
    <>
      {pixelId && <MetaPixel pixelId={pixelId} />}
      {(gaId || adsId) && (
        <GoogleTracking gaId={gaId} adsId={adsId} adsConversionLabel={adsConversionLabel} />
      )}
    </>
  );
}
