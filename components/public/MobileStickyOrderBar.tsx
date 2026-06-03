'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, MessageCircle } from 'lucide-react';
import { getWhatsAppHref } from '@/lib/utils/contact';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('product');
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

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sticky-bar-offset',
      visible ? '6rem' : '0px'
    );
  }, [visible]);

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

  const whatsappHref = whatsappNumber
    ? getWhatsAppHref(whatsappNumber, whatsappMessage || undefined)
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
                    {t('codBadge')}
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

              <div className="flex items-stretch gap-2 shrink-0">
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-11 rounded-xl bg-green-500 text-white shadow-md transition-all active:scale-[0.97] hover:bg-green-600"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </a>
                )}
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
                    <span>{inStock ? t('addToCart') : t('outOfStock')}</span>
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
    </div>
  );
}
