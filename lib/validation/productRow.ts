import { z } from 'zod';

export const productRowSchema = z.object({
  slug: z.string().min(1, 'Le slug est requis'),
  title_fr: z.string().min(1, 'Le titre en français est requis'),
  title_en: z.string().optional(),
  title_ar: z.string().optional(),
  subtitle_fr: z.string().optional(),
  subtitle_en: z.string().optional(),
  subtitle_ar: z.string().optional(),
  display_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

export type ProductRowFormData = z.infer<typeof productRowSchema>;
