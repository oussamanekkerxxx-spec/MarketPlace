'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatuses } from '@/lib/actions/orders';
import { CheckSquare, Square, ArrowDown, X } from 'lucide-react';

const statusOptions = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' },
  { value: 'no_answer', label: 'Sans réponse' },
  { value: 'fake', label: 'Fausse' },
  { value: 'returned', label: 'Retournée' },
];

interface BulkActionBarProps {
  orderIds: string[];
  selected: string[];
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onUpdated: () => void;
}

/**
 * Bulk action bar for the orders list.
 * - Desktop (`lg+`): inline row with "select all" + status dropdown + apply.
 * - Mobile (`<lg`): the "select all" toggle stays inline above the list, but
 *   the status dropdown + apply button move to a sticky bottom bar that
 *   slides in only when at least one row is selected.
 */
export function BulkActionBar({
  orderIds,
  selected,
  onToggleAll,
  onUpdated,
}: BulkActionBarProps) {
  const [isPending, startTransition] = useTransition();
  const [bulkStatus, setBulkStatus] = useState('');

  const allSelected = orderIds.length > 0 && selected.length === orderIds.length;
  const hasSelection = selected.length > 0;

  const handleBulkUpdate = () => {
    if (!bulkStatus || selected.length === 0) return;
    startTransition(async () => {
      await updateOrderStatuses(selected, bulkStatus);
      setBulkStatus('');
      onUpdated();
    });
  };

  const clearSelection = () => {
    // Toggle-all when everything is already selected acts as "deselect all".
    if (allSelected) onToggleAll();
    else {
      // Otherwise we don't have a one-shot deselect; mimic by toggling twice.
      onToggleAll(); // select all
      onToggleAll(); // deselect all
    }
  };

  if (orderIds.length === 0) return null;

  return (
    <>
      {/* ─── Inline row — always visible above the list ──────────────── */}
      <div className="flex items-center gap-3 mb-4">
        <button
          type="button"
          onClick={onToggleAll}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-2 min-h-[40px]"
        >
          {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          <span className="hidden sm:inline">
            {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
          </span>
          <span className="sm:hidden">{allSelected ? 'Tout déséléc.' : 'Tout sélect.'}</span>
          <span className="text-gray-400">({selected.length})</span>
        </button>

        {/* Desktop-only inline actions (mobile uses sticky bar below) */}
        {hasSelection && (
          <div className="hidden lg:flex items-center gap-2 ml-auto">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="text-sm border rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
            >
              <option value="">Changer le statut...</option>
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleBulkUpdate}
              disabled={!bulkStatus || isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
              {isPending ? '...' : 'Appliquer'}
            </button>
          </div>
        )}
      </div>

      {/* ─── Mobile sticky bottom bar — slides up when rows selected ──── */}
      <div
        className={`lg:hidden fixed bottom-0 inset-x-0 z-40 pointer-events-none transition-all duration-300 ${
          hasSelection ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
        aria-hidden={!hasSelection}
      >
        <div
          className="pointer-events-auto bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
        >
          <div className="px-3 py-3 space-y-2">
            {/* Top row: count + clear */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700">
                {selected.length} sélectionné{selected.length > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 py-1 px-2 -mr-2"
                aria-label="Effacer la sélection"
              >
                <X className="w-3.5 h-3.5" />
                Effacer
              </button>
            </div>

            {/* Action row: select + apply, full-width touch-friendly */}
            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                className="flex-1 min-w-0 text-sm border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-white"
                aria-label="Nouveau statut"
              >
                <option value="">Changer le statut...</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleBulkUpdate}
                disabled={!bulkStatus || isPending}
                className="shrink-0 inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-orange-600 text-white text-sm font-semibold rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[100px]"
              >
                <ArrowDown className="w-4 h-4" />
                {isPending ? '...' : 'Appliquer'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function OrderCheckbox({
  id,
  selected,
  onToggle,
}: {
  id: string;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <input
      type="checkbox"
      checked={selected}
      onChange={() => onToggle(id)}
      className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
    />
  );
}
