/**
 * Maps UTM source / referrer to the order_source enum value.
 * Falls back to 'direct' when nothing recognizable is found.
 */
export type OrderSource =
  | 'facebook'
  | 'instagram'
  | 'whatsapp'
  | 'telegram'
  | 'tiktok'
  | 'google'
  | 'direct'
  | 'other';

export function detectSource(
  utmSource?: string | null,
  referrer?: string | null
): OrderSource {
  const src = (utmSource || '').toLowerCase().trim();
  const ref = (referrer || '').toLowerCase().trim();

  if (src.includes('facebook') || src.includes('fb') || ref.includes('facebook.com')) {
    return 'facebook';
  }
  if (src.includes('instagram') || src.includes('ig') || ref.includes('instagram.com')) {
    return 'instagram';
  }
  if (src.includes('whatsapp') || ref.includes('whatsapp.com')) {
    return 'whatsapp';
  }
  if (src.includes('telegram') || ref.includes('t.me')) {
    return 'telegram';
  }
  if (src.includes('tiktok') || ref.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (src.includes('google') || ref.includes('google.')) {
    return 'google';
  }
  if (src) {
    return 'other';
  }

  return 'direct';
}
