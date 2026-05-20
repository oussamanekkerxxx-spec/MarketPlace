import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { CategoriesForm } from '@/components/admin/CategoriesForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modifier la catégorie',
};

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: category } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (!category) {
    notFound();
  }

  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('id, name_fr, parent_id')
    .order('display_order', { ascending: true });

  const categories = (categoriesRaw as Array<{ id: string; name_fr: string; parent_id: string | null }> | null) || [];

  return (
    <div>
      <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Modifier la catégorie</h1>
      <div className="max-w-xl">
        <CategoriesForm
          categories={categories}
          initialData={category}
          categoryId={id}
        />
      </div>
    </div>
  );
}
