/**
 * Structured server-side error logger.
 *
 * - Emits one JSON line per event to stderr (pipe to any log aggregator later).
 * - Generates a correlation ID per call so the user-visible "Ref" can be traced
 *   back to the full error in the logs.
 * - Scrubs known-sensitive fields (phone, email, address, tokens, cookies) so
 *   PII never leaks into the log stream.
 *
 * Never throws — logging must not break a request.
 */

import { randomUUID } from 'node:crypto';

export type LogLevel = 'error' | 'warn' | 'info';

export interface LogContext {
  /** Short stable code, e.g. 'AUTH_001'. Helps grep + alerting. */
  code?: string;
  /** Route or action name where the error occurred. */
  route?: string;
  /** Anonymised user identifier — never email/phone. */
  userId?: string;
  /** Free-form structured fields. Scrubbed before write. */
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'cookies',
  'phone',
  'customer_phone',
  'email',
  'customer_email',
  'address',
  'customer_address',
  'ip',
  'ip_address',
]);

function scrub(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[depth-limit]';
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => scrub(v, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = '[REDACTED]';
    } else {
      out[k] = scrub(v, depth + 1);
    }
  }
  return out;
}

function emit(level: LogLevel, msg: string, ctx: LogContext = {}): string {
  const correlationId = (ctx.correlationId as string) || randomUUID();

  const entry = {
    ts: new Date().toISOString(),
    level,
    msg,
    correlationId,
    ...(scrub(ctx) as Record<string, unknown>),
  };

  try {
    const line = JSON.stringify(entry);
    if (level === 'error') process.stderr.write(line + '\n');
    else process.stdout.write(line + '\n');
  } catch {
    // Logging must never throw
  }

  return correlationId;
}

/**
 * Log an error and get back the correlation ID. The ID is safe to show the
 * end user — they can quote it to support without leaking any context.
 */
export function logError(msg: string, ctx: LogContext = {}): string {
  return emit('error', msg, ctx);
}

export function logWarn(msg: string, ctx: LogContext = {}): string {
  return emit('warn', msg, ctx);
}

export function logInfo(msg: string, ctx: LogContext = {}): string {
  return emit('info', msg, ctx);
}

/** Generate a fresh correlation ID without logging anything. */
export function newCorrelationId(): string {
  return randomUUID();
}
