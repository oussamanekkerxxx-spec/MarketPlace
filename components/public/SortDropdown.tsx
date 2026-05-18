'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ArrowUpDown } from 'lucide-react';

interface SortDropdownProps {
  label?: string;
  options?: { value: string; label: string }[];
}

const defaultOptions = [
  { value: 'newest', label: 'Nouveautés' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
];

export function SortDropdown({ label = 'Trier par', options = defaultOptions }: SortDropdownProps) {
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
        aria-label={label}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
