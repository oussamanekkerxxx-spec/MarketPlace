'use client';

import Script from 'next/script';
import { useEffect } from 'react';

interface MetaPixelProps {
  pixelId: string | null;
  eventName?: 'PageView' | 'ViewContent' | 'Lead' | 'Purchase';
  eventData?: Record<string, unknown>;
}

export function MetaPixel({ pixelId, eventName = 'PageView', eventData }: MetaPixelProps) {
  useEffect(() => {
    if (!pixelId || typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 50; // 5s worst-case (50 × 100ms)

    const fire = () => {
      if (typeof window.fbq === 'function') {
        if (eventName === 'PageView') {
          window.fbq('track', 'PageView');
        } else if (eventName && eventData) {
          window.fbq('track', eventName, eventData);
        }
        return;
      }
      if (attempts++ < MAX_ATTEMPTS) {
        timeoutId = setTimeout(fire, 100);
      }
      // Give up silently after 5s — fbq script likely blocked by adblocker
    };

    fire();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pixelId, eventName, eventData]);

  if (!pixelId) return null;

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// Extend Window interface for fbq
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}
