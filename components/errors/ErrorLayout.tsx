import { Link } from '@/lib/i18n/navigation';
import type { LucideIcon } from 'lucide-react';
import type { Route } from 'next';

/**
 * Shared layout for every error/not-found page in the app.
 *
 * Branded: uses the site primary color (var(--color-primary), set by the root
 * layout from site_settings) and the same surfaces/typography as the rest of
 * the site, so error pages don't feel like an entirely different product.
 *
 * Slots: status code, decorative icon, title, body, optional reference ID,
 * and a list of action buttons.
 */

export type ErrorAction =
  | { type: 'link'; href: Route; label: string; variant?: 'primary' | 'secondary' }
  | { type: 'button'; onClick: () => void; label: string; variant?: 'primary' | 'secondary' };

export interface ErrorLayoutProps {
  /** Visible status code, e.g. "404", "500", "403". Empty string hides it. */
  code?: string;
  /** Decorative icon (lucide) shown in a tinted disc above the title. */
  icon: LucideIcon;
  /** Short headline. */
  title: string;
  /** Supporting paragraph. */
  body: string;
  /** Optional reference / correlation ID shown in muted monospace. */
  refId?: string;
  refLabel?: string;
  /** Action buttons rendered in a row, primary first. */
  actions: ErrorAction[];
  /** Apply min-h-screen instead of the default min-h-[70vh] (useful for global-error). */
  fullScreen?: boolean;
  /** Theme variant. "admin" uses muted surface; default uses public surface. */
  variant?: 'public' | 'admin';
}

export function ErrorLayout({
  code,
  icon: Icon,
  title,
  body,
  refId,
  refLabel = 'Ref',
  actions,
  fullScreen = false,
  variant = 'public',
}: ErrorLayoutProps) {
  const heightClass = fullScreen ? 'min-h-screen' : 'min-h-[70vh]';
  const bgClass = variant === 'admin' ? 'bg-surface-2' : 'bg-background';

  return (
    <div className={`${heightClass} ${bgClass} flex items-center justify-center px-4 py-12`}>
      <div className="w-full max-w-md text-center">
        {/* Decorative icon */}
        <div
          className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
            color: 'var(--color-primary)',
          }}
        >
          <Icon className="w-7 h-7" strokeWidth={1.75} />
        </div>

        {/* Status code (subtle) */}
        {code && (
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted mb-3">
            {code}
          </p>
        )}

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold text-secondary mb-3 leading-tight">
          {title}
        </h1>

        {/* Body */}
        <p className="text-sm sm:text-base text-text-muted leading-relaxed mb-8">{body}</p>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {actions.map((action, i) => {
              const isPrimary = action.variant !== 'secondary' && i === 0;
              const baseClasses =
                'inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold transition-all active:scale-[0.98]';
              const primaryClasses = 'text-white hover:opacity-90';
              const secondaryClasses =
                'text-secondary border border-border-warm bg-surface hover:bg-surface-2';
              const cls = `${baseClasses} ${isPrimary ? primaryClasses : secondaryClasses}`;
              const style = isPrimary ? { backgroundColor: 'var(--color-primary)' } : undefined;

              if (action.type === 'link') {
                return (
                  <Link key={i} href={action.href} className={cls} style={style}>
                    {action.label}
                  </Link>
                );
              }
              return (
                <button key={i} type="button" onClick={action.onClick} className={cls} style={style}>
                  {action.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Reference ID — last, muted, copy-safe */}
        {refId && (
          <p className="text-[11px] text-text-muted font-mono select-all break-all">
            {refLabel}: {refId}
          </p>
        )}
      </div>
    </div>
  );
}
