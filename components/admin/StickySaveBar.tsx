'use client';

import { Loader2, AlertCircle } from 'lucide-react';

interface StickySaveBarProps {
  /** Show the bar (typically when form is dirty) */
  visible: boolean;
  /** Saving in progress — disables button + shows spinner */
  saving?: boolean;
  /** Label override for the primary action */
  saveLabel?: string;
  /** Triggered when the bar's button is clicked (e.g. submit the form) */
  onSave: () => void;
  /** Optional secondary action (e.g. discard) */
  onDiscard?: () => void;
  discardLabel?: string;
}

/**
 * Sticky bottom action bar for long admin forms.
 * - Mobile: full-width bar at the bottom, safe-area aware
 * - Desktop: same position but with max-width and centered
 * - Hidden until `visible` becomes true (e.g. when form is dirty)
 */
export function StickySaveBar({
  visible,
  saving = false,
  saveLabel = 'Enregistrer',
  onSave,
  onDiscard,
  discardLabel = 'Annuler',
}: StickySaveBarProps) {
  return (
    <div
      className={`lg:hidden fixed bottom-0 inset-x-0 z-30 pointer-events-none transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
      aria-hidden={!visible}
    >
      <div
        className="pointer-events-auto bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 lg:py-3.5 lg:pl-72 flex items-center gap-3">
          <div className="flex-1 min-w-0 hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
            <span className="truncate">Modifications non enregistrées</span>
          </div>

          {onDiscard && (
            <button
              type="button"
              onClick={onDiscard}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {discardLabel}
            </button>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="flex-1 sm:flex-initial sm:min-w-[140px] inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              saveLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
