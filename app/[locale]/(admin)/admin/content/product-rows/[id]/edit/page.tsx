import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/PageHeader';
import { ProductRowForm } from '@/components/admin/ProductRowForm';
import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';

export const metadata: Metadata = {
  title: 'Modifier une section produit',
};

interface EditProductRowPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductRowPage({ params }: EditProductRowPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from('product_rows')
    .select('*')
    .eq('id', id)
    .single();

  if (!row) {
    notFound();
  }

  return (
    <div>
      <Link
        href="/admin/content/product-rows"
        className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux sections
      </Link>

      <PageHeader title="Modifier une section produit" />

      <div className="max-w-xl bg-white rounded-xl border p-6">
        <ProductRowForm
          rowId={row.id}
          initialData={{
            slug: row.slug,
            title_fr: row.title_fr,
            title_en: row.title_en,
            title_ar: row.title_ar,
            subtitle_fr: row.subtitle_fr,
            subtitle_en: row.subtitle_en,
            subtitle_ar: row.subtitle_ar,
            display_order: row.display_order,
            is_active: row.is_active,
          }}
        />
      </div>
    </div>
  );
}
