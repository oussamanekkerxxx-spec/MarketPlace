import { z } from 'zod';

export const citySchema = z.object({
  name_fr: z.string().min(1, 'Le nom en français est requis'),
  name_en: z.string().min(1, 'Le nom en anglais est requis'),
  name_ar: z.string().min(1, 'Le nom en arabe est requis'),
  shipping_fee: z.number().min(0, 'Le frais de livraison doit être positif'),
  estimated_days: z.number().min(0, 'Les jours estimés doivent être positifs'),
  is_active: z.boolean().optional(),
  display_order: z.number().optional(),
});

export type CityFormData = z.infer<typeof citySchema>;
