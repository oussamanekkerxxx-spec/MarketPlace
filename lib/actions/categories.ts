'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { categorySchema, type CategoryFormData } from '@/lib/validation/category';

async function checkAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
}

export async function createCategory(data: CategoryFormData) {
  await checkAuth();
  const supabase = await createClient();

  const result = categorySchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const insertData = {
    ...result.data,
    parent_id: result.data.parent_id || null,
  };

  const { error } = await supabase.from('categories').insert(insertData);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/categories', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('categories', 'default');
  return { success: true };
}

export async function updateCategory(id: string, data: CategoryFormData) {
  await checkAuth();
  const supabase = await createClient();

  const result = categorySchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const updateData = {
    ...result.data,
    parent_id: result.data.parent_id || null,
  };

  const { error } = await supabase.from('categories').update(updateData).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/categories', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('categories', 'default');
  return { success: true };
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
  await checkAuth();
  const supabase = await createClient();

  const { error } = await supabase.from('categories').update({ is_active: isActive }).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/categories', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('categories', 'default');
  return { success: true };
}
