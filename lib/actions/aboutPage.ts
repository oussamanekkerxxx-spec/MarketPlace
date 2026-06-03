'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

async function checkAuth(): Promise<{ error: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Non authentifié' };
  return null;
}

export async function getAboutContent() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('about_page_content')
    .select('*')
    .order('section', { ascending: true })
    .order('order_index', { ascending: true });

  if (error) return { error: error.message };
  return { data };
}

type AboutUpdateItem = {
  id: string;
  content_fr: string;
  content_en: string | null;
  content_ar: string | null;
};

export async function updateAboutContentBatch(items: AboutUpdateItem[]) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();

  for (const item of items) {
    const { error } = await supabase
      .from('about_page_content')
      .update({
        content_fr: item.content_fr,
        content_en: item.content_en || null,
        content_ar: item.content_ar || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    if (error) return { error: error.message };
  }

  revalidatePath('/[locale]/admin/content/about', 'page');
  revalidatePath('/[locale]/about', 'page');
  revalidateTag('about-content', 'default');
  return { success: true };
}

// Kept for potential future use but not exposed in UI
export async function createAboutPageItem(data: {
  section: 'story' | 'values' | 'cta';
  key: string;
  order_index: number;
  content_fr: string;
  content_en?: string | null;
  content_ar?: string | null;
}) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();
  const { error } = await supabase.from('about_page_content').insert({
    section: data.section,
    key: data.key,
    order_index: data.order_index,
    content_fr: data.content_fr,
    content_en: data.content_en || null,
    content_ar: data.content_ar || null,
  });

  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/content/about', 'page');
  revalidatePath('/[locale]/about', 'page');
  revalidateTag('about-content', 'default');
  return { success: true };
}

export async function deleteAboutPageItem(id: string) {
  const authError = await checkAuth();
  if (authError) return authError;

  const supabase = await createClient();
  const { error } = await supabase.from('about_page_content').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/[locale]/admin/content/about', 'page');
  revalidatePath('/[locale]/about', 'page');
  revalidateTag('about-content', 'default');
  return { success: true };
}
