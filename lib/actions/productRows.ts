'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { productRowSchema, type ProductRowFormData } from '@/lib/validation/productRow';

async function checkAuth(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };
  return null;
}

export async function createProductRow(data: ProductRowFormData) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const result = productRowSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const { error } = await supabase.from('product_rows').insert(result.data);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/content/product-rows', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('product-rows', 'default');
  return { success: true };
}

export async function updateProductRow(id: string, data: ProductRowFormData) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const result = productRowSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const { error } = await supabase.from('product_rows').update(result.data).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/content/product-rows', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('product-rows', 'default');
  return { success: true };
}

export async function deleteProductRow(id: string) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const { error } = await supabase.from('product_rows').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/content/product-rows', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('product-rows', 'default');
  return { success: true };
}

export async function toggleProductRowActive(id: string, isActive: boolean) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const { error } = await supabase.from('product_rows').update({ is_active: isActive }).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/content/product-rows', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('product-rows', 'default');
  return { success: true };
}
