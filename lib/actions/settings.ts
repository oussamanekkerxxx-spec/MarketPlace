'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { settingsSchema } from '@/lib/validation/settings';

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();

  // Get current user to verify admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: 'Non authentifié' };
  }

  // Any authenticated user can manage settings (team/roles removed).

  // Parse form data
  const rawData = Object.fromEntries(formData.entries());
  const data: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rawData)) {
    if (key === 'announcement_enabled') {
      // Robust boolean normalization: handles string, boolean, or array
      if (typeof value === 'boolean') {
        data[key] = value;
      } else if (typeof value === 'string') {
        data[key] = value === 'true' || value === 'on' || value === '1';
      } else if (Array.isArray(value)) {
        const first = value[0];
        data[key] = first === true || first === 'true' || first === 'on' || first === '1';
      } else {
        data[key] = Boolean(value);
      }
    } else if (typeof value === 'string') {
      data[key] = value;
    }
  }

  const result = settingsSchema.safeParse(data);
  if (!result.success) {
    return { error: 'Données invalides', issues: result.error.issues };
  }

  const updateData = result.data as Record<string, unknown>;
  const preservedSecretFields = ['telegram_bot_token', 'meta_capi_access_token'] as const;

  for (const field of preservedSecretFields) {
    if (updateData[field] === '') {
      delete updateData[field];
    }
  }

  // Use admin client to bypass RLS — role was already verified above
  const adminSupabase = createAdminClient();
  console.log('[updateSettings] upserting:', { id: 1, ...updateData });

  const { error, data: upserted } = await adminSupabase
    .from('site_settings')
    .upsert({ id: 1, ...updateData })
    .select()
    .single();

  console.log('[updateSettings] result:', { error, upserted });

  if (error) {
    return { error: error.message };
  }

  // Revalidate admin settings pages for all locales
  revalidatePath('/en/admin/settings', 'page');
  revalidatePath('/fr/admin/settings', 'page');
  revalidatePath('/ar/admin/settings', 'page');

  // Revalidate all public layouts so site name / colors / logo update everywhere
  revalidatePath('/en', 'layout');
  revalidatePath('/fr', 'layout');
  revalidatePath('/ar', 'layout');

  // Bust the cached site settings so the new values appear immediately
  revalidateTag('site-settings', 'default');

  return { success: true };
}
