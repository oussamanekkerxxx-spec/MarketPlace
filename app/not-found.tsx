import Link from 'next/link';

/**
 * Root 404 — fires for URLs that don't match any locale prefix.
 *
 * Lives outside [locale] so we can't use next-intl translations or the brand
 * primary color from site_settings. Self-contained inline styles + a short
 * bilingual message keep it useful for visitors in any language.
 */

export const metadata = {
  title: '404 — Page not found / Page introuvable',
};

export default function RootNotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: '#f8fafc',
        color: '#1e293b',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
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
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
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
          404
        </p>

        <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 12px', lineHeight: 1.2 }}>
          Page introuvable
        </h1>
        <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 32px', lineHeight: 1.6 }}>
          La page que vous recherchez n'existe pas.
          <br />
          <span style={{ opacity: 0.75 }}>The page you're looking for doesn't exist.</span>
        </p>

        <Link
          href="/"
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: '#FF6B35',
            color: '#fff',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Accueil / Home
        </Link>
      </div>
    </div>
  );
}
