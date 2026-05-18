export function normalizePhoneDigits(phone: string | null | undefined): string {
  return (phone || '').replace(/\D/g, '');
}

export function getPhoneHref(phone: string | null | undefined): string | null {
  const digits = normalizePhoneDigits(phone);
  if (digits.length < 6) return null;

  const sanitized = (phone || '').replace(/[^\d+]/g, '');
  return sanitized ? `tel:${sanitized}` : `tel:${digits}`;
}

export function getWhatsAppHref(
  phone: string | null | undefined,
  message?: string | null
): string | null {
  const digits = normalizePhoneDigits(phone);
  if (digits.length < 6) return null;

  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}
