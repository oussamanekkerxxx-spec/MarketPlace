import { z } from 'zod';

export const whyUsItemSchema = z.object({
  number_label_fr: z.string().min(1, 'Le numéro/titre en français est requis'),
  number_label_en: z.string().optional(),
  number_label_ar: z.string().optional(),
  title_fr: z.string().min(1, 'Le titre en français est requis'),
  title_en: z.string().optional(),
  title_ar: z.string().optional(),
  text_fr: z.string().min(1, 'Le texte en français est requis'),
  text_en: z.string().optional(),
  text_ar: z.string().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().optional(),
});

export type WhyUsItemFormData = z.infer<typeof whyUsItemSchema>;
