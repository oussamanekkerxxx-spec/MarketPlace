'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { heroImageSchema, type HeroImageFormData } from '@/lib/validation/heroImage';

async function checkAuth(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };
  return null;
}

export async function createHeroImage(data: HeroImageFormData) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const result = heroImageSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  // Enforce max 4 images
  const { count } = await supabase
    .from('hero_images')
    .select('*', { count: 'exact', head: true });

  if (count && count >= 4) {
    return { error: 'Maximum 4 images autorisées. Supprimez une image avant d\'en ajouter une nouvelle.' };
  }

  const { error } = await supabase.from('hero_images').insert(result.data);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/content/hero-images', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('hero-images', 'default');
  return { success: true };
}

export async function updateHeroImage(id: string, data: HeroImageFormData) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const result = heroImageSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const { error } = await supabase.from('hero_images').update(result.data).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/content/hero-images', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('hero-images', 'default');
  return { success: true };
}

export async function deleteHeroImage(id: string) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const { error } = await supabase.from('hero_images').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/content/hero-images', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('hero-images', 'default');
  return { success: true };
}

export async function toggleHeroImageActive(id: string, isActive: boolean) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  const { error } = await supabase.from('hero_images').update({ is_active: isActive }).eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/content/hero-images', 'page');
  revalidatePath('/[locale]', 'page');
  revalidateTag('hero-images', 'default');
  return { success: true };
}
