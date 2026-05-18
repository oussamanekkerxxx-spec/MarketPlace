'use client';

/**
 * Catastrophic error boundary — last line of defence.
 *
 * Renders when an error occurs in the root layout itself (so the regular
 * error.tsx boundaries can't catch it). It MUST include its own <html>/<body>
 * because it replaces the root layout entirely, and it CANNOT rely on the
 * i18n provider or theme tokens because those live above it in the tree.
 *
 * Keep it tiny, no external deps, no router. Inline styles so it works even
 * if the CSS bundle failed to load.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          background: '#f8fafc',
          color: '#1e293b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}
      >
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          {/* Decorative warning glyph — pure SVG so no font / icon library needed */}
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 24px',
              borderRadius: 16,
              background: 'rgba(255, 107, 53, 0.12)',
              color: '#FF6B35',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.18em',
              color: '#64748b',
              margin: '0 0 12px',
            }}
          >
            500
          </p>

          <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.2 }}>
            Service temporairement indisponible
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 32px', lineHeight: 1.6 }}>
            Le site rencontre un problème majeur. Veuillez recharger la page dans un instant.
            <br />
            <span style={{ opacity: 0.75 }}>
              The site is experiencing a major issue. Please reload in a moment.
            </span>
          </p>

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              onClick={reset}
              style={{
                padding: '10px 20px',
                background: '#FF6B35',
                color: '#fff',
                border: 'none',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Réessayer
            </button>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') window.location.href = '/';
              }}
              style={{
                padding: '10px 20px',
                background: '#fff',
                color: '#1e293b',
                border: '1px solid #e2e8f0',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Accueil
            </button>
          </div>

          {error.digest && (
            <p
              style={{
                fontSize: 11,
                color: '#94a3b8',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                wordBreak: 'break-all',
                margin: 0,
                userSelect: 'all',
              }}
            >
              Ref: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
