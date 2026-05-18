'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { citySchema, type CityFormData } from '@/lib/validation/city';

async function checkStaff() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Non authentifié');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  type ProfileRow = { role: 'admin' | 'manager' };
  const userProfile = profile as ProfileRow | null;

  if (!userProfile || !['admin', 'manager'].includes(userProfile.role)) {
    throw new Error('Accès non autorisé');
  }
}

export async function createCity(data: CityFormData) {
  await checkStaff();
  const supabase = await createClient();

  const result = citySchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const { error } = await supabase.from('cities').insert(result.data);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/cities', 'page');
  revalidateTag('cities', 'default');
  return { success: true };
}

export async function updateCity(id: string, data: CityFormData) {
  await checkStaff();
  const supabase = await createClient();

  const result = citySchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const { error } = await supabase.from('cities').update(result.data).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/cities', 'page');
  revalidateTag('cities', 'default');
  return { success: true };
}

export async function deleteCity(id: string) {
  await checkStaff();
  const supabase = await createClient();

  const { error } = await supabase.from('cities').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/cities', 'page');
  revalidateTag('cities', 'default');
  return { success: true };
}

export async function toggleCityActive(id: string, isActive: boolean) {
  await checkStaff();
  const supabase = await createClient();

  const { error } = await supabase.from('cities').update({ is_active: isActive }).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/cities', 'page');
  revalidateTag('cities', 'default');
  return { success: true };
}
