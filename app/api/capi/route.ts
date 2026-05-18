import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get settings (server-side only, not exposed to browser)
    const { data: settings } = await supabase
      .from('site_settings')
      .select('meta_capi_access_token, meta_dataset_id')
      .eq('id', 1)
      .single();

    const accessToken = settings?.meta_capi_access_token as string | null;
    const datasetId = settings?.meta_dataset_id as string | null;

    if (!accessToken || !datasetId) {
      return NextResponse.json({ error: 'CAPI not configured' }, { status: 400 });
    }

    const body = await request.json();
    const { event_name, event_id, event_time, user_data, custom_data } = body;

    const payload = {
      data: [
        {
          event_name,
          event_id,
          event_time: event_time || Math.floor(Date.now() / 1000),
          action_source: 'website',
          user_data: {
            client_ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '',
            client_user_agent: request.headers.get('user-agent') || '',
            ...user_data,
          },
          custom_data,
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

    const result = await response.json();

    // Log to pixel_events table for debugging
    await supabase.from('pixel_events').insert({
      event_name,
      event_id,
      payload: payload as unknown as Record<string, unknown>,
      sent_to_meta: response.ok,
      meta_response: result as unknown as Record<string, unknown>,
      error_message: !response.ok ? JSON.stringify(result) : null,
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Meta API error', details: result }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
