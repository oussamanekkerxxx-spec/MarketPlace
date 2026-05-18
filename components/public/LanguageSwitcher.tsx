'use client';

import { usePathname, useRouter } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';
import { useParams } from 'next/navigation';

const localeLabels: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
  ar: 'AR',
};

export function LanguageSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params?.locale as string) || routing.defaultLocale;

  return (
    <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-lg bg-surface-2 border border-border-warm">
      {routing.locales.map((locale) => {
        const isActive = currentLocale === locale;
        return (
          <button
            key={locale}
            onClick={() => router.push(pathname, { locale })}
            className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'text-text-muted hover:text-secondary'
            }`}
            aria-label={`Switch to ${locale}`}
            aria-current={isActive ? 'true' : undefined}
          >
            {localeLabels[locale]}
          </button>
        );
      })}
    </div>
  );
}
