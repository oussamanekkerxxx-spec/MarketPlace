import { createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './lib/i18n/routing';

const intlMiddleware = createMiddleware(routing);

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''} https://connect.facebook.net https://challenges.cloudflare.com`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https://*.supabase.co https://www.facebook.com",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co https://graph.facebook.com https://www.facebook.com https://challenges.cloudflare.com",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "frame-src https://challenges.cloudflare.com https://www.facebook.com",
  ].join('; ');
}

function applySecurityHeaders(response: NextResponse, csp: string): NextResponse {
  response.headers.set('Content-Security-Policy', csp);
  return response;
}

function cloneMiddlewareResponse(source: NextResponse, requestHeaders: Headers): NextResponse {
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  source.headers.forEach((value, key) => {
    response.headers.set(key, value);
  });

  source.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

export default async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID();
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  let response = intlMiddleware(request);

  if (response.status !== 200) {
    return applySecurityHeaders(response, csp);
  }

  response = cloneMiddlewareResponse(response, requestHeaders);

  const pathname = request.nextUrl.pathname;
  const maybeLocale = pathname.split('/')[1];
  const locale = routing.locales.includes(maybeLocale as 'fr' | 'en' | 'ar')
    ? maybeLocale
    : routing.defaultLocale;

  if (pathname.includes('/admin') && !pathname.includes('/login')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const loginUrl = new URL(`/${locale}/login`, request.url);
      return applySecurityHeaders(NextResponse.redirect(loginUrl), csp);
    }
  }

  return applySecurityHeaders(response, csp);
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next|_vercel|.*\\..*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
