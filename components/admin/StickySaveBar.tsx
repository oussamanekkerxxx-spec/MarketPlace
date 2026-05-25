'use client';

import { Loader2, AlertCircle } from 'lucide-react';

interface StickySaveBarProps {
  /** Whether the form has unsaved changes — controls visual state only */
  dirty: boolean;
  /** Saving in progress — shows spinner + disables buttons */
  saving?: boolean;
  /** Label override for the primary action */
  saveLabel?: string;
  /** Optional secondary action (e.g. discard) */
  onDiscard?: () => void;
  discardLabel?: string;
  /** Explicit form id for the submit button (helps fixed-position bars on mobile) */
  formId?: string;
}

/**
 * Sticky bottom action bar for long admin forms.
 * - Mobile: full-width bar at the bottom, safe-area aware
 * - Desktop: same position but with max-width and centered
 * - Save button is disabled when there are no changes
 */
export function StickySaveBar({
  dirty,
  saving = false,
  saveLabel = 'Enregistrer',
  onDiscard,
  discardLabel = 'Annuler',
  formId,
}: StickySaveBarProps) {
  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 pointer-events-auto">
      <div
        className="pointer-events-auto bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0px)' }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 lg:py-3.5 lg:pl-72 flex items-center gap-3">
          <div
            className={`flex-1 min-w-0 hidden sm:flex items-center gap-2 text-sm ${
              dirty ? 'text-gray-600' : 'text-gray-400'
            }`}
          >
            <AlertCircle className={`w-4 h-4 shrink-0 ${dirty ? 'text-orange-500' : 'text-gray-300'}`} />
            <span className="truncate">
              {dirty ? 'Modifications non enregistrées' : 'Aucune modification'}
            </span>
          </div>

          {onDiscard && (
            <button
              type="button"
              onClick={onDiscard}
              disabled={saving || !dirty}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-40 disabled:text-gray-400"
            >
              {discardLabel}
            </button>
          )}

          {/* type="submit" lets the browser natively submit the parent <form> */}
          <button
            type="submit"
            form={formId}
            disabled={saving || !dirty}
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
