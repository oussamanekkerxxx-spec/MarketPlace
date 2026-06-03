'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowUpDown } from 'lucide-react';

const sortValues = ['newest', 'bestsellers', 'price-asc', 'price-desc'] as const;

export function SortDropdown() {
  const t = useTranslations('category');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort') || 'newest';

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'newest') {
      params.delete('sort');
    } else {
      params.set('sort', value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="w-4 h-4 text-text-muted" />
      <select
        value={currentSort}
        onChange={(e) => handleChange(e.target.value)}
        className="text-sm font-medium text-secondary bg-transparent border-none outline-none cursor-pointer hover:text-primary transition-colors"
        aria-label={t('sortBy')}
      >
        {sortValues.map((value) => (
          <option key={value} value={value}>
            {t(value === 'newest' ? 'sortNewest' : value === 'bestsellers' ? 'sortBestsellers' : value === 'price-asc' ? 'sortPriceAsc' : 'sortPriceDesc')}
          </option>
        ))}
      </select>
    </div>
  );
}
