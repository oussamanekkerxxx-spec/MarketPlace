'use client';

import { useMemo } from 'react';
import { getWhatsAppHref } from '@/lib/utils/contact';

interface SmartWhatsAppButtonProps {
  whatsappNumber?: string | null;
  defaultMessages: {
    fr: string;
    en: string;
    ar: string;
  };
}

function detectLocale(pathname: string): 'fr' | 'en' | 'ar' {
  if (pathname.startsWith('/en/') || pathname === '/en') return 'en';
  if (pathname.startsWith('/ar/') || pathname === '/ar') return 'ar';
  return 'fr';
}

function isProductPage(pathname: string): boolean {
  return /^(?:\/(?:fr|en|ar))?\/product\/[^\/]+$/.test(pathname);
}

function buildProductMessage(
  locale: 'fr' | 'en' | 'ar',
  title: string,
  price: string,
  currency: string,
  url: string,
  imageUrl: string,
  defaultMsg: string
): string {
  const base = defaultMsg || (() => {
    switch (locale) {
      case 'en': return 'Hello, I am interested in this product:';
      case 'ar': return 'مرحباً، أنا مهتم بهذا المنتج:';
      default: return 'Bonjour, je suis intéressé(e) par ce produit :';
    }
  })();

  const details = (() => {
    switch (locale) {
      case 'en':
        return `${title}\nPrice: ${price} ${currency}\n\n${url}${imageUrl ? '\n\n' + imageUrl : ''}`;
      case 'ar':
        return `${title}\nالسعر: ${price} ${currency}\n\n${url}${imageUrl ? '\n\n' + imageUrl : ''}`;
      default:
        return `${title}\nPrix : ${price} ${currency}\n\n${url}${imageUrl ? '\n\n' + imageUrl : ''}`;
    }
  })();

  return `${base}\n\n${details}`;
}

function buildDefaultMessage(
  locale: 'fr' | 'en' | 'ar',
  defaults: SmartWhatsAppButtonProps['defaultMessages']
): string {
  switch (locale) {
    case 'en':
      return defaults.en || 'Hello, I have a question';
    case 'ar':
      return defaults.ar || 'مرحباً، لدي سؤال';
    case 'fr':
    default:
      return defaults.fr || "Bonjour, j'ai une question";
  }
}

export function SmartWhatsAppButton({ whatsappNumber, defaultMessages }: SmartWhatsAppButtonProps) {
  const href = useMemo(() => {
    if (!whatsappNumber) return null;

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const locale = detectLocale(pathname);

    if (isProductPage(pathname)) {
      const dataEl = document.getElementById('product-whatsapp-data');
      if (dataEl) {
        const title = dataEl.getAttribute('data-title') || '';
        const price = dataEl.getAttribute('data-price') || '';
        const currency = dataEl.getAttribute('data-currency') || '';
        const url = dataEl.getAttribute('data-url') || (typeof window !== 'undefined' ? window.location.href : '');
        const imageUrl = dataEl.getAttribute('data-image') || '';
        const defaultMsg = buildDefaultMessage(locale, defaultMessages);
        const message = buildProductMessage(locale, title, price, currency, url, imageUrl, defaultMsg);
        return getWhatsAppHref(whatsappNumber, message);
      }
    }

    // Non-product page: use the locale-specific default message
    const generalMessage = buildDefaultMessage(locale, defaultMessages);
    return getWhatsAppHref(whatsappNumber, generalMessage);
  }, [whatsappNumber, defaultMessages]);

  if (!whatsappNumber) return null;

  return (
    <a
      href={href || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-105 transition-all transition-[bottom] duration-300"
      style={{ bottom: 'calc(1.5rem + var(--sticky-bar-offset, 0px))' }}
      aria-label="Contact WhatsApp"
    >
      <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}
