import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/PageHeader';
import { HeroImageForm } from '@/components/admin/HeroImageForm';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';

export const metadata: Metadata = {
  title: 'Modifier une image du hero',
};

interface EditHeroImagePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditHeroImagePage({ params }: EditHeroImagePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('hero_images')
    .select('*')
    .eq('id', id)
    .single();

  if (!item) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/content/hero-images"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux images du hero
      </Link>

      <PageHeader title="Modifier une image du hero" />

      <div className="max-w-xl bg-white rounded-xl border p-6">
        <HeroImageForm
          itemId={item.id}
          initialData={{
            url: item.url,
            alt_text: item.alt_text,
            display_order: item.display_order,
            is_active: item.is_active,
          }}
        />
      </div>
    </div>
  );
}
