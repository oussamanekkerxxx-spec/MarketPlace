import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { cache } from 'react';

export const createClient = cache(async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component context
            // where cookies can't be mutated. This is expected — middleware
            // (proxy.ts) handles session refresh on the actual response.
            // Intentionally silent: this fires on every Server Component render
            // and is not actionable.
          }
        },
      },
    }
  );
});

/**
 * Create a Supabase client without reading request cookies.
 * Use this inside `unstable_cache()` or other cache scopes where
 * accessing dynamic data sources like `cookies()` is not allowed.
 */
export function createStaticClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op
        },
      },
    }
  );
}

/**
 * Create a Supabase client using the SERVICE_ROLE key.
 *
 * **WARNING:** Bypasses Row-Level Security. ONLY call this from:
 *   - cached admin analytics queries (`unstable_cache` wrappers)
 *   - server-only background tasks
 *
 * NEVER use this client to fulfill user-facing requests directly — caller
 * code must enforce its own auth check.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // no-op
        },
      },
    }
  );
}
