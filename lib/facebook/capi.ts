'use server';

import { sendCapiEventServerSide, type CapiEventParams } from './capi-server';

export type { CapiEventParams } from './capi-server';

/**
 * Send an event to Meta Conversions API (CAPI) server-side.
 * This is a thin 'use server' wrapper around the core logic so it can be
 * called from both Client Components (as a Server Action) and Server
 * Components (by importing the underlying function directly).
 *
 * Failures are swallowed — never break a user-facing flow because of a pixel.
 */
export async function sendCapiEvent(params: CapiEventParams) {
  return sendCapiEventServerSide(params);
}
