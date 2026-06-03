export function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone || '').replace(/\D/g, '');
}

/**
 * Convert any Moroccan phone number format to international digits (212XXXXXXXXX).
 * Handles: 0612345678, +212612345678, 612345678
 */
export function toInternationalDigits(phone: string | null | undefined): string {
  const digits = normalizePhoneDigits(phone);
  if (!digits) return '';

  // 10 digits starting with 0 → Moroccan local format
  if (digits.length === 10 && digits.startsWith('0')) {
    return '212' + digits.slice(1);
  }

  // 9 digits starting with 5-7 → user typed without prefix (UI shows +212 visually)
  if (digits.length === 9 && /^[5-7]/.test(digits)) {
    return '212' + digits;
  }

  // Already starts with 212
  if (digits.startsWith('212')) {
    return digits;
  }

  return digits;
}

export function getPhoneHref(phone: string | null | undefined): string | null {
  const digits = normalizePhoneDigits(phone);
  if (digits.length < 6) return null;

  const international = toInternationalDigits(phone);
  if (international.startsWith('212')) {
    return `tel:+${international}`;
  }

  const sanitized = (phone || '').replace(/[^\d+]/g, '');
  return sanitized ? `tel:${sanitized}` : `tel:${digits}`;
}

export function getWhatsAppHref(
  phone: string | null | undefined,
  message?: string | null
): string | null {
  const digits = normalizePhoneDigits(phone);
  if (digits.length < 6) return null;

  const international = toInternationalDigits(phone);
  return `https://wa.me/${international}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
