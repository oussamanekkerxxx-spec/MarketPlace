import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/PageHeader';
import type { Metadata } from 'next';
import { AboutContentEditor } from '@/components/admin/AboutContentEditor';

export const metadata: Metadata = {
  title: 'À propos',
};

type AboutRow = {
  id: string;
  section: string;
  key: string;
  order_index: number;
  content_fr: string;
  content_en: string | null;
  content_ar: string | null;
  active: boolean;
};

export default async function AboutContentPage() {
  const supabase = await createClient();

  const { data: itemsRaw } = await supabase
    .from('about_page_content')
    .select('*')
    .eq('active', true)
    .order('section', { ascending: true })
    .order('order_index', { ascending: true });

  const items = (itemsRaw as AboutRow[] | null) || [];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Page À propos"
        description="Modifier le contenu de la page À propos. Toutes les modifications sont appliquées immédiatement."
      />

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          Aucun contenu configuré. Veuillez exécuter la migration pour initialiser le contenu par défaut.
        </div>
      ) : (
        <AboutContentEditor items={items} />
      )}
    </div>
  );
}
