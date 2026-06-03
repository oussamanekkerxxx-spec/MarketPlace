import { z } from 'zod';

export const aboutPageItemSchema = z.object({
  section: z.enum(['story', 'values', 'cta']),
  key: z.string().min(1, 'La clé est requise'),
  order_index: z.number().int().min(0).optional(),
  content_fr: z.string().min(1, 'Le contenu en français est requis'),
  content_en: z.string().optional(),
  content_ar: z.string().optional(),
  active: z.boolean().optional(),
});

export type AboutPageItemFormData = z.infer<typeof aboutPageItemSchema>;
