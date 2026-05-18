'use client';

import { useEffect } from 'react';

interface PixelEventProps {
  eventName: 'ViewContent' | 'Lead' | 'Purchase' | 'AddToCart' | 'InitiateCheckout';
  eventData?: Record<string, unknown>;
  eventId?: string;
}

export function PixelEvent({ eventName, eventData, eventId }: PixelEventProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkFbq = () => {
      if (typeof window.fbq === 'function') {
        const options = eventId ? { eventID: eventId } : undefined;
        if (eventData) {
          window.fbq('track', eventName, eventData, options);
        } else {
          window.fbq('track', eventName, undefined, options);
        }
      } else {
        setTimeout(checkFbq, 100);
      }
    };

    checkFbq();
  }, [eventName, eventData, eventId]);

  return null;
}
