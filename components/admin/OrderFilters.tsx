'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

const statusOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmee' },
  { value: 'shipped', label: 'Expediee' },
  { value: 'delivered', label: 'Livree' },
  { value: 'cancelled', label: 'Annulee' },
  { value: 'no_answer', label: 'Pas de reponse' },
  { value: 'fake', label: 'Fausse' },
  { value: 'returned', label: 'Retournee' },
];

interface OrderFiltersProps {
  cities: Array<{ name_fr: string }>;
}

export function OrderFilters({ cities }: OrderFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(`${pathname}?${createQueryString(name, value)}`);
  };

  const handleSearchChange = (value: string) => {
    const trimmed = value.trim();
    const isPhone = trimmed !== '' && /^[+\d\s()-]+$/.test(trimmed);
    handleFilterChange(isPhone ? 'phone' : 'order', value);
    handleFilterChange(isPhone ? 'order' : 'phone', '');
  };

  const activeFilters = [
    searchParams.get('status'),
    searchParams.get('city'),
    searchParams.get('phone'),
    searchParams.get('order'),
  ].filter(Boolean).length;

  const activeFilterChips = [
    searchParams.get('status')
      ? {
          key: 'status',
          label: statusOptions.find((option) => option.value === searchParams.get('status'))?.label || 'Statut',
        }
      : null,
    searchParams.get('city')
      ? {
          key: 'city',
          label: searchParams.get('city') || 'Ville',
        }
      : null,
    searchParams.get('phone')
      ? {
          key: 'phone',
          label: `Tel: ${searchParams.get('phone')}`,
        }
      : null,
    searchParams.get('order')
      ? {
          key: 'order',
          label: `Cmd: ${searchParams.get('order')}`,
        }
      : null,
  ].filter((chip): chip is { key: string; label: string } => Boolean(chip));

  const reset = () => router.push(pathname);

  return (
    <div className="mb-4">
      <div className="lg:hidden space-y-2.5">
        <div className="space-y-3 rounded-2xl border bg-white p-3 shadow-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="N° commande ou telephone..."
              value={searchParams.get('order') || searchParams.get('phone') || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-xl border bg-gray-50 py-2.5 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-orange-500"
            />
            {(searchParams.get('order') || searchParams.get('phone')) && (
              <button
                type="button"
                onClick={() => {
                  handleFilterChange('order', '');
                  handleFilterChange('phone', '');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                aria-label="Effacer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((value) => !value)}
              className="inline-flex items-center gap-1.5 rounded-xl border bg-white px-3 py-2 text-xs font-semibold text-gray-700 transition-transform active:scale-95"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filtres
              {activeFilters > 0 && (
                <span className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                  {activeFilters}
                </span>
              )}
            </button>
            {activeFilters > 0 && (
              <button
                type="button"
                onClick={reset}
                className="text-xs font-medium text-gray-500 underline-offset-2 hover:underline"
              >
                Reinitialiser
              </button>
            )}
          </div>

          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilterChips.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleFilterChange(chip.key, '')}
                  className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-[11px] font-semibold text-orange-700"
                >
                  {chip.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out"
          style={{
            maxHeight: mobileFiltersOpen ? '400px' : '0px',
            opacity: mobileFiltersOpen ? 1 : 0,
          }}
        >
          <div className="space-y-2.5 rounded-2xl border bg-white p-3 shadow-sm">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Statut
              </label>
              <select
                value={searchParams.get('status') || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Ville
              </label>
              <select
                value={searchParams.get('city') || ''}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="">Toutes les villes</option>
                {cities.map((city, index) => (
                  <option key={index} value={city.name_fr}>
                    {city.name_fr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-wrap items-center gap-3">
        <select
          value={searchParams.get('status') || ''}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={searchParams.get('city') || ''}
          onChange={(e) => handleFilterChange('city', e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-orange-500 outline-none"
        >
          <option value="">Toutes les villes</option>
          {cities.map((city, index) => (
            <option key={index} value={city.name_fr}>
              {city.name_fr}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Rechercher par telephone..."
          value={searchParams.get('phone') || ''}
          onChange={(e) => handleFilterChange('phone', e.target.value)}
          className="w-48 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
        />

        <input
          type="text"
          placeholder="N° commande..."
          value={searchParams.get('order') || ''}
          onChange={(e) => handleFilterChange('order', e.target.value)}
          className="w-40 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
        />

        {activeFilters > 0 && (
          <button
            type="button"
            onClick={reset}
            className="px-3 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            Reinitialiser
          </button>
        )}
      </div>
    </div>
  );
}
