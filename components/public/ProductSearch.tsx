'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function ProductSearch() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const t = useTranslations('navigation');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center">
      {/* Collapsed: just icon on mobile, icon + compact input on desktop */}
      <form
        onSubmit={handleSubmit}
        className={`flex items-center transition-all duration-200 ${
          isOpen ? 'w-56 md:w-72' : 'w-9 md:w-48'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="p-2 text-text-muted hover:text-primary hover:bg-surface-2 rounded-lg transition-colors shrink-0"
          aria-label={t('search')}
        >
          <Search className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={t('search')}
          className={`bg-transparent text-sm text-text placeholder:text-text-muted outline-none transition-all duration-200 ${
            isOpen ? 'w-full opacity-100 px-1' : 'w-0 opacity-0 px-0'
          }`}
        />

        {isOpen && query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-1 text-text-muted hover:text-text rounded-md transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>
    </div>
  );
}
