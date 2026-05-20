'use server';

import { createHash } from 'crypto';
import { cookies, headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export interface CapiUserData {
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zip?: string | null;
  external_id?: string | null;
}

export interface CapiEventParams {
  eventName: 'Purchase' | 'Lead' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout';
  eventId: string;
  userData?: CapiUserData;
  customData?: Record<string, unknown>;
}

/**
 * SHA-256 hex digest of a normalized (trimmed + lowercased) value.
 * Meta requires this for em/ph/fn/ln/ct/st/country/zp/external_id.
 */
function sha256(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normalize a phone to E.164-style digits-only (no +, no spaces).
 * Defaults to Morocco (+212) for local 10-digit numbers starting with 0.
 */
function normalizePhone(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 10) digits = '212' + digits.slice(1);
  return digits || undefined;
}

/**
 * Build the user_data block Meta CAPI expects, with PII hashed and
 * non-PII (ip/ua/fbc/fbp) passed in plain text.
 */
async function buildUserData(
  raw: CapiUserData | undefined,
  clientIp: string,
  clientUa: string
): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const fbc = cookieStore.get('_fbc')?.value;
  const fbp = cookieStore.get('_fbp')?.value;

  const fullName = raw?.name?.trim();
  const firstFromFull = fullName ? fullName.split(/\s+/)[0] : undefined;
  const lastFromFull = fullName ? fullName.split(/\s+/).slice(1).join(' ') || undefined : undefined;

  const hashed: Record<string, string | undefined> = {
    em: sha256(raw?.email),
    ph: sha256(normalizePhone(raw?.phone)),
    fn: sha256(raw?.first_name ?? firstFromFull),
    ln: sha256(raw?.last_name ?? lastFromFull),
    ct: sha256(raw?.city),
    st: sha256(raw?.state),
    country: sha256(raw?.country),
    zp: sha256(raw?.zip),
    external_id: sha256(raw?.external_id),
  };

  const userData: Record<string, string> = {
    client_ip_address: clientIp,
    client_user_agent: clientUa,
  };
  if (fbc) userData.fbc = fbc;
  if (fbp) userData.fbp = fbp;
  for (const [k, v] of Object.entries(hashed)) {
    if (v) userData[k] = v;
  }
  return userData;
}

/**
 * Send an event to Meta Conversions API (CAPI) server-side.
 * Logs every attempt to the pixel_events table for debugging.
 * Failures are swallowed — never break a user-facing flow because of a pixel.
 */
export async function sendCapiEvent(params: CapiEventParams) {
  try {
    const supabase = await createClient();

    const { data: settings } = await supabase
      .from('site_settings')
      .select('meta_capi_access_token, meta_dataset_id')
      .eq('id', 1)
      .single();

    const accessToken = settings?.meta_capi_access_token as string | null;
    const datasetId = settings?.meta_dataset_id as string | null;

    if (!accessToken || !datasetId) {
      return;
    }

    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const clientIp = (forwardedFor?.split(',')[0] || realIp || '').trim();
    const clientUa = headersList.get('user-agent') || '';

    const userData = await buildUserData(params.userData, clientIp, clientUa);

    const payload = {
      data: [
        {
          event_name: params.eventName,
          event_id: params.eventId,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data: userData,
          custom_data: params.customData,
        },
      ],
    };

    // Use Authorization header instead of query param so the token
    // never appears in server logs, proxy logs, or referrer headers.
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${datasetId}/events`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    let metaResponse: unknown = null;
    let errorMessage: string | null = null;

    try {
      metaResponse = await response.json();
    } catch {
      metaResponse = null;
    }

    if (!response.ok) {
      const errorObj = (metaResponse as Record<string, unknown>)?.error as Record<string, unknown> | undefined;
      errorMessage =
        (errorObj?.message as string) ||
        `HTTP ${response.status}`;
    }

    // Log to pixel_events table (fire-and-forget)
    await supabase.from('pixel_events').insert({
      event_name: params.eventName,
      event_id: params.eventId,
      payload: payload as unknown as Record<string, unknown>,
      sent_to_meta: response.ok,
      meta_response: metaResponse as Record<string, unknown> | null,
      error_message: errorMessage,
    });
  } catch {
    // Never throw — pixel failures must not break orders
  }
}
