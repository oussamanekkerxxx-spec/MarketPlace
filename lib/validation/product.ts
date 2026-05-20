import { z } from 'zod';

export const productImageSchema = z.object({
  url: z.string().url(),
  alt_text: z.string().nullish(),
  display_order: z.number().int().min(0),
  is_primary: z.boolean().nullish(),
});

export const detailSectionSchema = z.object({
  id: z.string(),
  image: z.string().url().optional().or(z.literal('')),
  headline_fr: z.string().optional(),
  headline_en: z.string().optional(),
  headline_ar: z.string().optional(),
  body_fr: z.string().optional(),
  body_en: z.string().optional(),
  body_ar: z.string().optional(),
  position: z.enum(['center', 'left', 'right']).optional(),
  theme: z.enum(['light', 'dark']).optional(),
});

export type DetailSectionFormData = z.infer<typeof detailSectionSchema>;

export const productSchema = z.object({
  title_fr: z.string().min(1, 'Le titre en français est requis'),
  title_en: z.string().min(1, 'Le titre en anglais est requis'),
  title_ar: z.string().min(1, 'Le titre en arabe est requis'),
  slug: z.string().min(1, 'Le slug est requis'),
  short_description_fr: z.string().optional(),
  short_description_en: z.string().optional(),
  short_description_ar: z.string().optional(),
  description_fr: z.string().optional(),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  price: z.number().min(0.01, 'Le prix doit être supérieur à 0'),
  compare_at_price: z.number().min(0).optional(),
  currency: z.string().optional(),
  category_id: z.string().uuid().optional().or(z.literal('')),
  sku: z.string().optional(),
  stock_quantity: z.number().min(0).optional(),
  track_inventory: z.boolean().optional(),
  low_stock_threshold: z.number().min(0).optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  bulk_discount_threshold: z.number().min(2).optional(),
  bulk_discount_percent: z.number().min(0).max(100).optional(),
  attributes: z.object({
    features_fr: z.array(z.string()).optional(),
    features_en: z.array(z.string()).optional(),
    features_ar: z.array(z.string()).optional(),
  }).optional(),
  meta_title_fr: z.string().optional(),
  meta_title_en: z.string().optional(),
  meta_title_ar: z.string().optional(),
  meta_description_fr: z.string().optional(),
  meta_description_en: z.string().optional(),
  meta_description_ar: z.string().optional(),
  images: z.array(productImageSchema).optional(),
  detail_sections: z.array(detailSectionSchema).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductImageFormData = z.infer<typeof productImageSchema>;
