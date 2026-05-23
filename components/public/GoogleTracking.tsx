'use client';

import Script from 'next/script';
import { useEffect } from 'react';

interface GoogleTrackingProps {
  gaId: string | null;
  adsId: string | null;
  adsConversionLabel: string | null;
}

export function GoogleTracking({ gaId, adsId, adsConversionLabel }: GoogleTrackingProps) {
  useEffect(() => {
    if (!gaId && !adsId) return;

    // Fire initial page_view when gtag becomes available
    const checkAndFire = () => {
      if (typeof window.gtag === 'function') {
        if (gaId) {
          window.gtag('config', gaId, {
            page_location: window.location.href,
            page_title: document.title,
          });
        }
        if (adsId) {
          window.gtag('config', adsId);
        }
      }
    };

    // gtag script loads asynchronously; wait briefly then fire
    const timeout = setTimeout(checkAndFire, 500);
    return () => clearTimeout(timeout);
  }, [gaId, adsId]);

  if (!gaId && !adsId) return null;

  const primaryId = gaId || adsId;

  return (
    <>
      <Script
        id="google-gtag"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${primaryId}`}
      />
      <Script
        id="google-gtag-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            ${gaId ? `gtag('config', '${gaId}');` : ''}
            ${adsId ? `gtag('config', '${adsId}');` : ''}
          `,
        }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Event helpers
// ---------------------------------------------------------------------------

export function gtagEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | unknown>
) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

/** Fire a Google Ads conversion event */
export function gtagConversion(
  adsId: string,
  conversionLabel: string,
  params?: { value?: number; currency?: string; transaction_id?: string }
) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', {
      send_to: `${adsId}/${conversionLabel}`,
      ...params,
    });
  }
}

// Extend Window interface for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (
      command: 'js' | 'config' | 'event' | 'conversion',
      targetOrEvent: string,
      params?: Record<string, unknown>
    ) => void;
  }
}
