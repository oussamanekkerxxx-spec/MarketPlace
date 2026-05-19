import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const AUTH_ERROR_PATTERNS = /Invalid Refresh Token|Refresh Token Not Found|JWT expired|auth|session/i;

export function isAuthError(error: unknown): boolean {
  if (error instanceof Error) {
    return AUTH_ERROR_PATTERNS.test(error.message);
  }
  if (typeof error === 'string') {
    return AUTH_ERROR_PATTERNS.test(error);
  }
  return false;
}

export function redirectToLogin(locale?: string) {
  const path = locale ? `/${locale}/login` : '/login';
  window.location.href = path;
}
