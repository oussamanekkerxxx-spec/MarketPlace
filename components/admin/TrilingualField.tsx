'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface TrilingualFieldProps {
  fr: ReactNode;
  en: ReactNode;
  ar: ReactNode;
  label?: string;
}

type Lang = 'fr' | 'en' | 'ar';

const LANG_LABELS: Record<Lang, string> = {
  fr: 'Francais',
  en: 'English',
  ar: 'Arabic',
};

const LANG_ABBREV: Record<Lang, string> = {
  fr: 'FR',
  en: 'EN',
  ar: 'AR',
};

const DESKTOP_QUERY = '(min-width: 1024px)';

export function TrilingualField({ fr, en, ar, label }: TrilingualFieldProps) {
  const [openLang, setOpenLang] = useState<Lang>('fr');
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY);
    const updateViewport = (matches: boolean) => setIsDesktop(matches);

    updateViewport(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      const handleChange = (event: MediaQueryListEvent) => updateViewport(event.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    const legacyHandleChange = (event: MediaQueryListEvent) => updateViewport(event.matches);
    mediaQuery.addListener(legacyHandleChange);
    return () => mediaQuery.removeListener(legacyHandleChange);
  }, []);

  const fields: Record<Lang, ReactNode> = { fr, en, ar };
  const order: Lang[] = ['fr', 'en', 'ar'];

  return (
    <div className="space-y-3">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}

      {isDesktop ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {order.map((lang) => (
            <div key={lang} className="relative">
              <span className="absolute left-3 top-2 text-xs font-medium uppercase text-gray-400">
                {LANG_ABBREV[lang]}
              </span>
              <div className="pt-6">{fields[lang]}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y overflow-hidden rounded-lg border border-gray-200 bg-white">
          {order.map((lang) => {
            const isOpen = openLang === lang;

            return (
              <div key={lang}>
                <button
                  type="button"
                  onClick={() => setOpenLang(lang)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors active:bg-gray-50"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        isOpen ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {LANG_ABBREV[lang]}
                    </span>
                    <span className={`text-sm ${isOpen ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                      {LANG_LABELS[lang]}
                    </span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : 'rotate-0'
                    }`}
                  />
                </button>
                <div
                  className="overflow-hidden transition-[max-height] duration-300 ease-out"
                  style={{ maxHeight: isOpen ? '600px' : '0px' }}
                >
                  <div className="p-3" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    {fields[lang]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
