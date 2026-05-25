import { z } from 'zod';

export const heroImageSchema = z.object({
  url: z.string().min(1, "L'URL de l'image est requise"),
  alt_text: z.string().optional(),
  display_order: z.number().optional(),
  is_active: z.boolean().optional(),
});

export type HeroImageFormData = z.infer<typeof heroImageSchema>;
