import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modifier le produit',
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  const { data: productImages } = await supabase
    .from('product_images')
    .select('url, alt_text, display_order, is_primary')
    .eq('product_id', id)
    .order('display_order');

  if (!product) {
    notFound();
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_fr')
    .eq('is_active', true)
    .order('name_fr');

  return (
    <div>
      <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Modifier le produit</h1>
      <ProductForm
        categories={categories || []}
        initialData={{ ...product, images: productImages || [] }}
        productId={id}
      />
    </div>
  );
}
