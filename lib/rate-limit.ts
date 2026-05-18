interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Simple in-memory rate limiter
// For production with multiple instances, use Redis (Upstash)
export function rateLimit(identifier: string, maxRequests: number, windowMs: number): { success: boolean; resetAt: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  // Clean up expired entries occasionally
  if (store.size > 10000) {
    for (const [key, value] of store.entries()) {
      if (value.resetAt < now) store.delete(key);
    }
  }

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(identifier, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { success: true, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { success: false, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, resetAt: entry.resetAt };
}
