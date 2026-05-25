'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { useParams } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';

function MoroccoFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden="true">
      <rect width="60" height="30" rx="4" fill="#C1272D" />
      <polygon
        points="30,8 34.1,20.7 23.3,12.8 36.7,12.8 25.9,20.7"
        fill="#006233"
        fillRule="evenodd"
      />
    </svg>
  );
}

function FranceFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden="true">
      <rect width="60" height="30" rx="4" fill="#fff" />
      <rect width="20" height="30" rx="4" fill="#0055A4" />
      <rect x="20" width="20" height="30" fill="#fff" />
      <rect x="40" width="20" height="30" rx="4" fill="#EF4135" />
    </svg>
  );
}

function UkFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden="true">
      <rect width="60" height="30" rx="4" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="3.5" />
      <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
      <rect width="60" height="30" rx="4" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
    </svg>
  );
}

const flagComponents: Record<string, React.FC<{ className?: string }>> = {
  ar: MoroccoFlag,
  fr: FranceFlag,
  en: UkFlag,
};

const localeNames: Record<string, string> = {
  ar: 'العربية',
  fr: 'Français',
  en: 'English',
};

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as string) || routing.defaultLocale;
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const CurrentFlag = flagComponents[currentLocale];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (locale: string) => {
    setIsOpen(false);
    if (locale !== currentLocale) {
      router.push(pathname, { locale });
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`flex items-center gap-1 rounded-md border px-1.5 py-1 transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          isOpen
            ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
            : 'border-border-warm bg-surface hover:border-primary/40'
        }`}
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <CurrentFlag className="w-6 h-3 sm:w-7 sm:h-3.5 rounded-sm" />
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[9rem] rounded-xl border border-border-warm bg-surface shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {routing.locales.map((locale) => {
            const isActive = currentLocale === locale;
            const Flag = flagComponents[locale];
            return (
              <button
                key={locale}
                type="button"
                onClick={() => handleSelect(locale)}
                className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/5 text-primary font-semibold'
                    : 'text-secondary hover:bg-surface-2'
                }`}
              >
                <Flag className="w-6 h-3 rounded-sm shrink-0" />
                <span className="flex-1 text-left">{localeNames[locale]}</span>
                {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
