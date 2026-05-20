import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsForm } from '@/components/admin/SettingsForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Paramètres',
};

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: settingsRaw } = await supabase
    .from('site_settings')
    .select('*')
    .eq('id', 1)
    .single();

  const settingsRecord = settingsRaw as Record<string, unknown> | null;
  const settings = settingsRecord
    ? {
        ...settingsRecord,
        // Never hydrate stored secrets into client-rendered form state.
        telegram_bot_token: '',
        meta_capi_access_token: '',
      }
    : null;
  const secretStatus = {
    hasMetaCapiAccessToken: Boolean(settingsRecord?.meta_capi_access_token),
  };

  return (
    <div>
      <h1 className="text-lg lg:text-2xl font-bold mb-3 lg:mb-6">Parametres</h1>
      <SettingsForm initialData={settings} secretStatus={secretStatus} />
    </div>
  );
}
