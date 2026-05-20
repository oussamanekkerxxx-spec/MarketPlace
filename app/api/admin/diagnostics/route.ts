import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Admin diagnostics endpoint — checks which server-side env vars are present.
 * Does NOT leak values; only reports presence, length, and environment.
 * Useful for debugging "works locally but not on Vercel" env var issues.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Any authenticated user can view diagnostics (team/roles removed).

  const check = (key: string) => {
    const val = process.env[key];
    return {
      present: !!val,
      length: val?.length || 0,
      // Show first/last 4 chars only so we can spot typos without leaking full keys
      preview: val && val.length > 8
        ? `${val.slice(0, 4)}…${val.slice(-4)}`
        : val
          ? '***'
          : null,
    };
  };

  const diagnostics = {
    node_env: process.env.NODE_ENV || 'unknown',
    vercel_env: process.env.VERCEL_ENV || 'not-vercel',
    region: process.env.VERCEL_REGION || 'unknown',
    vars: {
      RESEND_API_KEY: check('RESEND_API_KEY'),
      FROM_EMAIL: check('FROM_EMAIL'),
      ADMIN_EMAIL: check('ADMIN_EMAIL'),
      INTERNAL_API_SECRET: check('INTERNAL_API_SECRET'),
      TURNSTILE_SECRET_KEY: check('TURNSTILE_SECRET_KEY'),
      NEXT_PUBLIC_SITE_URL: check('NEXT_PUBLIC_SITE_URL'),
    },
  };

  return NextResponse.json(diagnostics);
}
