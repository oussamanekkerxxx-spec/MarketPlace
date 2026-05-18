'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const periods = [
  { shortLabel: '7j', label: '7 jours', value: '7' },
  { shortLabel: '30j', label: '30 jours', value: '30' },
  { shortLabel: '90j', label: '90 jours', value: '90' },
];

export function PeriodSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get('period') || '30';

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('period', value);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => handleChange(period.value)}
          className={`px-2.5 py-1.5 lg:px-3 text-xs lg:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
            current === period.value
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <span className="lg:hidden">{period.shortLabel}</span>
          <span className="hidden lg:inline">{period.label}</span>
        </button>
      ))}
    </div>
  );
}
