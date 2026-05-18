import { createClient } from '@/lib/supabase/server';
import { ProductForm } from '@/components/admin/ProductForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nouveau produit',
};

export default async function NewProductPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_fr')
    .eq('is_active', true)
    .order('name_fr');

  return (
    <div>
      <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Nouveau produit</h1>
      <ProductForm categories={categories || []} />
    </div>
  );
}
