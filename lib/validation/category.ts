import { z } from 'zod';

export const categorySchema = z.object({
  name_fr: z.string().min(1, 'Le nom en français est requis'),
  name_en: z.string().min(1, 'Le nom en anglais est requis'),
  name_ar: z.string().min(1, 'Le nom en arabe est requis'),
  slug: z.string().min(1, 'Le slug est requis'),
  description_fr: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  image_url: z.string().optional(),
  parent_id: z.string().uuid().optional().or(z.literal('')),
  display_order: z.number().optional(),
  is_active: z.boolean().optional(),
  meta_title_fr: z.string().optional(),
  meta_title_en: z.string().optional(),
  meta_title_ar: z.string().optional(),
  meta_description_fr: z.string().optional(),
  meta_description_en: z.string().optional(),
  meta_description_ar: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
