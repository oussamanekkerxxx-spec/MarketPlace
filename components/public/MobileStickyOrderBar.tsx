'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';

interface MobileStickyOrderBarProps {
  price: number;
  compareAtPrice?: number | null;
  currency: string;
  formAnchorId: string;
  inStock: boolean;
  productImage?: string | null;
  productTitle?: string;
  whatsappNumber?: string | null;
  whatsappMessage?: string;
}

export function MobileStickyOrderBar({
  price,
  compareAtPrice,
  currency,
  formAnchorId,
  inStock,
  productImage,
  productTitle,
  whatsappNumber,
  whatsappMessage,
}: MobileStickyOrderBarProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(formAnchorId);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [formAnchorId]);

  const handleClick = () => {
    const target = document.getElementById(formAnchorId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const savings = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;
  const whatsappDigits = whatsappNumber?.replace(/\D/g, '') || '';
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}${whatsappMessage ? `?text=${encodeURIComponent(whatsappMessage)}` : ''}`
    : null;

  return (
    <div
      className={`lg:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none transition-all duration-400 ${
        visible
          ? 'translate-y-0 opacity-100'
          : 'translate-y-full opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <div
        className="pointer-events-auto px-3 pb-3 pt-2"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 12px)' }}
      >
        <div className="flex items-end gap-2">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-[0_10px_24px_rgba(34,197,94,0.38)] transition-transform active:scale-[0.96]"
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              }}
            >
              <MessageCircle className="h-6 w-6" />
            </a>
          )}

          <div
            className="relative flex-1 rounded-2xl overflow-hidden border shadow-[0_-2px_8px_rgba(0,0,0,0.04),0_12px_32px_rgba(0,0,0,0.18)]"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: 'rgba(0,0,0,0.06)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, var(--color-primary) 50%, transparent 100%)',
                opacity: 0.5,
              }}
            />

            <div className="flex items-stretch gap-3 p-2.5">
              {productImage && (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  <Image
                    src={productImage}
                    alt={productTitle || ''}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                  {hasDiscount && (
                    <span
                      className="absolute -top-1 -right-1 rounded-full px-1.5 py-1 text-[10px] font-bold leading-none text-white shadow-md"
                      style={{ backgroundColor: 'var(--color-primary)' }}
                    >
                      -{savings}%
                    </span>
                  )}
                </div>
              )}

              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <div className="mb-0.5 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" style={{ color: 'var(--color-primary)' }} />
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: '#6B7280' }}
                  >
                    Paiement a la livraison
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-xl font-bold leading-none tabular-nums"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {price}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {currency}
                  </span>
                  {hasDiscount && (
                    <span
                      className="text-xs line-through tabular-nums"
                      style={{ color: '#9CA3AF' }}
                    >
                      {compareAtPrice}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleClick}
                disabled={!inStock}
                className="group relative shrink-0 overflow-hidden rounded-xl px-5 text-sm font-bold text-white shadow-md transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: inStock
                    ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)'
                    : '#9CA3AF',
                  minWidth: '120px',
                }}
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -translate-x-full transition-transform duration-500 ease-out group-active:translate-x-full"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                  }}
                />
                <span className="relative inline-flex items-center justify-center gap-1.5 py-4">
                  <span>{inStock ? 'Commander' : 'Rupture'}</span>
                  {inStock && (
                    <ArrowRight className="h-4 w-4 transition-transform group-active:translate-x-0.5" />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
