'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { productSchema, type ProductFormData } from '@/lib/validation/product';
import DOMPurify from 'isomorphic-dompurify';

function normalizeDetailSections(sections: ProductFormData['detail_sections']) {
  if (!sections || sections.length === 0) return undefined;

  const normalized = sections
    .map((section) => ({
      ...section,
      image: section.image?.trim() || '',
      headline_fr: section.headline_fr?.trim() || '',
      headline_en: section.headline_en?.trim() || '',
      headline_ar: section.headline_ar?.trim() || '',
      body_fr: section.body_fr?.trim() || '',
      body_en: section.body_en?.trim() || '',
      body_ar: section.body_ar?.trim() || '',
      position: section.position || 'center',
      theme: section.theme || 'light',
    }))
    .filter(
      (section) =>
        Boolean(section.image) ||
        Boolean(section.headline_fr) ||
        Boolean(section.headline_en) ||
        Boolean(section.headline_ar) ||
        Boolean(section.body_fr) ||
        Boolean(section.body_en) ||
        Boolean(section.body_ar)
    );

  return normalized.length > 0 ? normalized : undefined;
}

function isMissingDetailSectionsColumn(message: string | undefined) {
  if (!message) return false;
  return /detail_sections/i.test(message) && /(column|schema cache)/i.test(message);
}

function parseDbError(message: string): string {
  if (/duplicate key value violates unique constraint/i.test(message)) {
    if (/slug/.test(message)) return 'Ce slug est déjà utilisé par un autre produit.';
    if (/sku/.test(message)) return 'Ce SKU est déjà utilisé par un autre produit.';
    return 'Une valeur unique est déjà utilisée par un autre produit.';
  }
  return message;
}

async function checkAuth(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };
  return null;
}

export async function createProduct(data: ProductFormData) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const result = productSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const { images, detail_sections, ...productData } = result.data;
  const normalizedDetailSections = normalizeDetailSections(detail_sections);

  const insertData = {
    ...productData,
    category_id: productData.category_id || null,
    compare_at_price: productData.compare_at_price ?? null,
    sku: productData.sku || null,
    description_fr: DOMPurify.sanitize(productData.description_fr || ''),
    description_en: DOMPurify.sanitize(productData.description_en || ''),
    description_ar: DOMPurify.sanitize(productData.description_ar || ''),
    ...(normalizedDetailSections ? { detail_sections: normalizedDetailSections } : {}),
  };

  const { data: created, error } = await supabase.from('products').insert(insertData).select().single();
  if (error) {
    if (normalizedDetailSections && isMissingDetailSectionsColumn(error.message)) {
      return {
        error:
          "La base ne connait pas encore le champ detail_sections. Appliquez la migration 07_add_detail_sections.sql puis reessayez.",
      };
    }
    return { error: parseDbError(error.message) };
  }

  if (images && images.length > 0 && created) {
    const imageRows = images.map((img, i) => ({
      product_id: created.id,
      url: img.url,
      alt_text: img.alt_text || null,
      display_order: i,
      is_primary: img.is_primary || i === 0,
    }));
    const { error: imgError } = await supabase.from('product_images').insert(imageRows);
    if (imgError) {
      console.error('Failed to insert product images:', imgError);
    }
  }

  revalidatePath('/[locale]/admin/products', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('products', 'default');
  return { success: true };
}

export async function updateProduct(id: string, data: ProductFormData) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const result = productSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const { images, detail_sections, ...productData } = result.data;
  const normalizedDetailSections = normalizeDetailSections(detail_sections);

  const updateData = {
    ...productData,
    category_id: productData.category_id || null,
    compare_at_price: productData.compare_at_price ?? null,
    sku: productData.sku || null,
    description_fr: DOMPurify.sanitize(productData.description_fr || ''),
    description_en: DOMPurify.sanitize(productData.description_en || ''),
    description_ar: DOMPurify.sanitize(productData.description_ar || ''),
    ...(normalizedDetailSections ? { detail_sections: normalizedDetailSections } : {}),
  };

  const { error } = await supabase.from('products').update(updateData).eq('id', id);
  if (error) {
    if (normalizedDetailSections && isMissingDetailSectionsColumn(error.message)) {
      return {
        error:
          "La base ne connait pas encore le champ detail_sections. Appliquez la migration 07_add_detail_sections.sql puis reessayez.",
      };
    }
    return { error: parseDbError(error.message) };
  }

  const { error: deleteError } = await supabase.from('product_images').delete().eq('product_id', id);
  if (deleteError) {
    console.error('Failed to delete old product images:', deleteError);
  }

  if (images && images.length > 0) {
    const imageRows = images.map((img, i) => ({
      product_id: id,
      url: img.url,
      alt_text: img.alt_text || null,
      display_order: i,
      is_primary: img.is_primary || i === 0,
    }));
    const { error: imgError } = await supabase.from('product_images').insert(imageRows);
    if (imgError) {
      console.error('Failed to insert product images:', imgError);
    }
  }

  revalidatePath('/[locale]/admin/products', 'page');
  revalidatePath('/[locale]/product/[slug]', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('products', 'default');
  return { success: true };
}

export async function toggleProductActive(id: string, isActive: boolean) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/products', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('products', 'default');
  return { success: true };
}

export async function toggleProductFeatured(id: string, isFeatured: boolean) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const { error } = await supabase.from('products').update({ is_featured: isFeatured }).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/products', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('products', 'default');
  return { success: true };
}

export async function deleteProduct(id: string) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/products', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('products', 'default');
  return { success: true };
}
