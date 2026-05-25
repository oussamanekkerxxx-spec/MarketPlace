'use client';

import { ReactNode, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AdminAccordionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** Open by default on mount */
  defaultOpen?: boolean;
  /** Optional badge shown next to the title (e.g. error count, "Modifié") */
  badge?: ReactNode;
  /** Always render content (mounted) even when collapsed — useful for forms so values aren't lost. Default: true */
  keepMounted?: boolean;
  /**
   * When true, the section is force-opened (overriding user collapse) — typically
   * because it contains a validation error that the user must address. Toggling
   * the header while `hasError` is true is a no-op.
   */
  hasError?: boolean;
  children: ReactNode;
}

/**
 * Collapsible form section for admin pages.
 * - On desktop (lg+): always expanded — wraps content in a card. The header is
 *   shown as a section title; no toggle needed because there's room for everything.
 * - On mobile (<lg): collapsible, tap header to expand/collapse. Defaults to closed
 *   unless `defaultOpen` is set.
 *
 * Use `keepMounted` to keep child form fields in the DOM even when collapsed,
 * which preserves uncommitted values across open/close cycles.
 */
export function AdminAccordion({
  title,
  description,
  icon,
  defaultOpen = false,
  badge,
  keepMounted = true,
  hasError = false,
  children,
}: AdminAccordionProps) {
  const [userOpen, setUserOpen] = useState(defaultOpen);
  // Force open when there's an error in this section, regardless of user toggle
  const open = hasError || userOpen;

  return (
    <section
      className={`bg-white rounded-lg lg:rounded-xl border border-gray-200 overflow-hidden ${
        hasError ? 'ring-2 ring-red-300 ring-inset' : ''
      }`}
    >
      {/* Mobile header — tap to collapse/expand */}
      <button
        type="button"
        onClick={() => {
          // While there's an error, the section is locked open
          if (hasError) return;
          setUserOpen((v) => !v);
        }}
        className="lg:hidden w-full flex items-center gap-3 px-4 py-3.5 active:bg-gray-50 transition-colors text-left"
        aria-expanded={open}
        aria-invalid={hasError || undefined}
      >
        {icon && (
          <span
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              hasError
                ? 'bg-red-50 text-red-600'
                : 'bg-orange-50 text-orange-600'
            }`}
          >
            {icon}
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span
            className={`block text-sm font-semibold truncate ${
              hasError ? 'text-red-700' : 'text-gray-900'
            }`}
          >
            {title}
          </span>
          {description && (
            <span className="block text-xs text-gray-500 truncate mt-0.5">
              {hasError ? 'Veuillez corriger les erreurs ci-dessous' : description}
            </span>
          )}
        </span>
        {hasError && (
          <span className="shrink-0 w-2 h-2 rounded-full bg-red-500" aria-label="Erreur" />
        )}
        {badge && <span className="shrink-0">{badge}</span>}
        {!hasError && (
          <ChevronDown
            className={`shrink-0 w-4 h-4 text-gray-400 transition-transform duration-200 ${
              open ? 'rotate-180' : 'rotate-0'
            }`}
          />
        )}
      </button>

      {/* Desktop header — static, always shown */}
      <div className="hidden lg:flex items-start gap-3 border-b border-gray-100 px-6 pt-6 pb-3">
        {icon && (
          <span
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              hasError ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'
            }`}
          >
            {icon}
          </span>
        )}
        <div className="flex-1">
          <h2
            className={`text-lg font-semibold ${
              hasError ? 'text-red-700' : 'text-gray-900'
            }`}
          >
            {title}
          </h2>
          {description && (
            <p className="text-xs text-gray-500 mt-0.5">
              {hasError ? 'Veuillez corriger les erreurs ci-dessous' : description}
            </p>
          )}
        </div>
        {hasError && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700"
          >
            Erreur
          </span>
        )}
        {badge}
      </div>

      {/*
        Single content area — children rendered ONCE.
        On mobile (<lg), the inline maxHeight/opacity drive the collapse animation.
        On lg+, the `lg:!` overrides force the section permanently open so the
        inline styles don't hide content on desktop.
      */}
      <div
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out lg:max-h-none! lg:opacity-100! lg:overflow-visible!"
        style={{
          maxHeight: open ? '5000px' : '0px',
          opacity: open ? 1 : 0,
        }}
        aria-hidden={!open ? true : undefined}
      >
        {(open || keepMounted) && (
          <div className="px-4 pb-4 pt-1 space-y-4 border-t border-gray-100 lg:px-6 lg:pb-6 lg:pt-4 lg:border-t-0">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}
