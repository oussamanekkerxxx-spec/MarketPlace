import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { WhyUsItemForm } from '@/components/admin/WhyUsItemForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Modifier l\'élément',
};

export default async function EditWhyUsItemPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from('why_us_items')
    .select('*')
    .eq('id', id)
    .single();

  if (!item) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Modifier l&apos;élément</h1>
      <div className="max-w-xl">
        <WhyUsItemForm initialData={item} itemId={id} />
      </div>
    </div>
  );
}
