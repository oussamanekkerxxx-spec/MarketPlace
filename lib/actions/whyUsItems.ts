'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { whyUsItemSchema, type WhyUsItemFormData } from '@/lib/validation/whyUsItem';

async function checkAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');
}

export async function createWhyUsItem(data: WhyUsItemFormData) {
  await checkAuth();
  const supabase = await createClient();

  const result = whyUsItemSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const { error } = await supabase.from('why_us_items').insert(result.data);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/why-us', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('why-us-items', 'default');
  return { success: true };
}

export async function updateWhyUsItem(id: string, data: WhyUsItemFormData) {
  await checkAuth();
  const supabase = await createClient();

  const result = whyUsItemSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const { error } = await supabase.from('why_us_items').update(result.data).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/why-us', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('why-us-items', 'default');
  return { success: true };
}

export async function deleteWhyUsItem(id: string) {
  await checkAuth();
  const supabase = await createClient();

  const { error } = await supabase.from('why_us_items').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/why-us', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('why-us-items', 'default');
  return { success: true };
}

export async function toggleWhyUsItemActive(id: string, isActive: boolean) {
  await checkAuth();
  const supabase = await createClient();

  const { error } = await supabase.from('why_us_items').update({ is_active: isActive }).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/why-us', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('why-us-items', 'default');
  return { success: true };
}
