import { z } from 'zod';

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Le numero de telephone est requis')
  .refine(
    (value) => /^(0[5-7]\d{8}|\+212[5-7]\d{8})$/.test(value.replace(/\s/g, '')),
    'Format invalide. Ex: 0612345678 ou +212612345678'
  );

const optionalShortText = z.string().trim().max(255, 'Valeur trop longue').optional();
const optionalTrackingValue = z.string().trim().max(512, 'Valeur trop longue').optional();

export const reservationSchema = z.object({
  customer_name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caracteres').max(120, 'Le nom est trop long'),
  customer_phone: phoneSchema,
  customer_city_name: z.string().trim().min(2, 'Veuillez entrer votre ville').max(120, 'Le nom de la ville est trop long'),
  customer_address: optionalShortText,
  turnstileToken: z.string().min(1, 'Veuillez valider que vous etes humain'),
  // Honeypot - must stay empty
  website: optionalShortText,
  // Attribution (injected by client from URL / cookies)
  utm_source: optionalTrackingValue,
  utm_medium: optionalTrackingValue,
  utm_campaign: optionalTrackingValue,
  utm_term: optionalTrackingValue,
  utm_content: optionalTrackingValue,
  referrer: z.string().trim().max(2048, 'Valeur trop longue').optional(),
});

export const reservationServerSchema = z.object({
  product_id: z.string().uuid('Produit invalide'),
  customer_name: z.string().trim().min(2, 'Le nom doit contenir au moins 2 caracteres').max(120, 'Le nom est trop long'),
  customer_phone: phoneSchema,
  customer_city_name: z.string().trim().min(2, 'Ville invalide').max(120, 'Le nom de la ville est trop long'),
  customer_address: optionalShortText,
  quantity: z.number().int().min(1, 'Quantite invalide').max(99, 'Quantite invalide'),
  discount_percent: z.number().min(0).max(100).optional(),
  discount_amount: z.number().min(0).optional(),
  turnstile_token: z.string().trim().max(2048, 'Jeton de securite invalide').optional(),
  website: optionalShortText,
  utm_source: optionalTrackingValue,
  utm_medium: optionalTrackingValue,
  utm_campaign: optionalTrackingValue,
  utm_term: optionalTrackingValue,
  utm_content: optionalTrackingValue,
  referrer: z.string().trim().max(2048, 'Valeur trop longue').optional(),
});

export type ReservationInput = z.infer<typeof reservationSchema>;
export type ReservationServerInput = z.infer<typeof reservationServerSchema>;
