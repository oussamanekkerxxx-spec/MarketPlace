'use client';

import { useSyncExternalStore } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/i18n/navigation';

const CONSENT_KEY = 'cookie-consent';
const CONSENT_EVENT = 'cookie-consent-change';

type Consent = 'accepted' | 'essential' | null;

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (!event.key || event.key === CONSENT_KEY) {
      onStoreChange();
    }
  };

  const handleConsentChange = () => onStoreChange();

  window.addEventListener('storage', handleStorage);
  window.addEventListener(CONSENT_EVENT, handleConsentChange);

  return () => {
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener(CONSENT_EVENT, handleConsentChange);
  };
}

function getConsentSnapshot(): Consent {
  if (typeof window === 'undefined') return null;
  // Auto-accept when no explicit choice was made (banner is hidden)
  return (window.localStorage.getItem(CONSENT_KEY) as Consent) || 'accepted';
}

function getServerSnapshot(): Consent {
  return null;
}

export function useCookieConsent() {
  const consent = useSyncExternalStore(subscribe, getConsentSnapshot, getServerSnapshot);

  const accept = (value: Consent) => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(CONSENT_KEY, value || '');
    window.dispatchEvent(new Event(CONSENT_EVENT));
  };

  return { consent, accept, hasMarketingConsent: consent === 'accepted' };
}

export function CookieConsentBanner() {
  const t = useTranslations('cookies');
  const { consent, accept } = useCookieConsent();

  if (consent !== null) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-4">
      <div
        className="mx-auto max-w-5xl rounded-2xl border bg-white/98 shadow-[0_18px_60px_rgba(12,8,24,0.16)] backdrop-blur"
        style={{
          borderColor: 'rgba(12, 8, 24, 0.08)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 0px)',
        }}
      >
        <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0 text-sm text-gray-600">
            <p className="mb-1 text-sm font-semibold text-secondary">{t('title')}</p>
            <p className="leading-relaxed">
              {t('description')}{' '}
              <Link href="/privacy" className="font-medium text-orange-600 hover:underline">
                {t('learnMore')}
              </Link>
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <button
              onClick={() => accept('essential')}
              className="rounded-xl border px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t('reject')}
            </button>
            <button
              onClick={() => accept('accepted')}
              className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
            >
              {t('accept')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
