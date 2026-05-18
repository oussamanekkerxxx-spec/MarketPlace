'use server';

import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export interface CapiEventParams {
  eventName: 'Purchase' | 'Lead' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout';
  eventId: string;
  userData?: Record<string, string | null | undefined>;
  customData?: Record<string, unknown>;
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

    const payload = {
      data: [
        {
          event_name: params.eventName,
          event_id: params.eventId,
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data: {
            client_ip_address: clientIp,
            client_user_agent: clientUa,
            ...params.userData,
          },
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
