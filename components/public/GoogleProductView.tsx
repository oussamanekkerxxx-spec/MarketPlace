'use client';

import { useEffect } from 'react';
import { gtagEvent } from './GoogleTracking';

interface GoogleProductViewProps {
  productId: string;
  productName: string;
  price: number;
  currency: string;
}

export function GoogleProductView({ productId, productName, price, currency }: GoogleProductViewProps) {
  useEffect(() => {
    gtagEvent('view_item', {
      currency,
      value: price,
      items: [
        {
          item_id: productId,
          item_name: productName,
          price,
          quantity: 1,
        },
      ],
    });
  }, [productId, productName, price, currency]);

  return null;
}
