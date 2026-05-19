'use client';

import { useEffect } from 'react';
import { gtagConversion, gtagEvent } from './GoogleTracking';

interface GooglePurchaseConversionProps {
  adsId: string | null;
  adsConversionLabel: string | null;
  value: number;
  currency: string;
  transactionId: string;
}

export function GooglePurchaseConversion({
  adsId,
  adsConversionLabel,
  value,
  currency,
  transactionId,
}: GooglePurchaseConversionProps) {
  useEffect(() => {
    if (!adsId || !adsConversionLabel) return;

    // Google Ads conversion
    gtagConversion(adsId, adsConversionLabel, {
      value,
      currency,
      transaction_id: transactionId,
    });

    // GA4 purchase event
    gtagEvent('purchase', {
      transaction_id: transactionId,
      value,
      currency,
    });
  }, [adsId, adsConversionLabel, value, currency, transactionId]);

  return null;
}
