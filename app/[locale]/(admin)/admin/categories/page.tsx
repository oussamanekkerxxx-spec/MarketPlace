import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/PageHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Catégories',
};
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CategoriesForm } from '@/components/admin/CategoriesForm';
import { AdminAccordion } from '@/components/admin/AdminAccordion';
import Image from 'next/image';
import { FolderTree } from 'lucide-react';

export default async function CategoriesPage() {
  const supabase = await createClient();

  type CategoryRow = {
    id: string;
    name_fr: string;
    name_en: string;
    name_ar: string;
    slug: string;
    image_url: string | null;
    display_order: number;
    is_active: boolean;
    description_fr: string | null;
    description_en: string | null;
    description_ar: string | null;
    parent_id: string | null;
  };

  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });

  const categories = (categoriesRaw as CategoryRow[] | null) || [];

  return (
    <div>
      <PageHeader
        title="Catégories"
        description={`${categories.length} catégorie${categories.length > 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
        {/* List — shown first on mobile (most common task is browsing) */}
        <div className="lg:col-span-2 lg:order-2 order-1">
          {/* Mobile — card list */}
          <div className="lg:hidden space-y-2">
            {categories.length === 0 ? (
              <div className="bg-white rounded-xl border p-6 text-center text-sm text-gray-500">
                Aucune catégorie
              </div>
            ) : (
              categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-xl border shadow-sm flex items-center gap-3 p-2.5"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    {cat.image_url ? (
                      <Image src={cat.image_url} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                        {cat.name_fr.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {cat.name_fr}
                      </p>
                      <StatusBadge status={cat.is_active ? 'active' : 'inactive'} />
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {cat.name_en} · {cat.name_ar}
                    </p>
                    <code className="inline-block text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mt-1">
                      {cat.slug}
                    </code>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop — table */}
          <div className="hidden lg:block">
            <DataTable
              data={categories}
              keyExtractor={(row) => row.id}
              emptyMessage="Aucune catégorie"
              columns={[
                {
                  key: 'image',
                  header: '',
                  cell: (row) => (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden relative">
                      {row.image_url ? (
                        <Image src={row.image_url} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {row.name_fr.charAt(0)}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'name',
                  header: 'Nom',
                  cell: (row) => (
                    <div>
                      <div className="font-medium">{row.name_fr}</div>
                      <div className="text-xs text-gray-500">{row.name_en} · {row.name_ar}</div>
                    </div>
                  ),
                },
                {
                  key: 'slug',
                  header: 'Slug',
                  cell: (row) => <code className="text-xs bg-gray-100 px-2 py-1 rounded">{row.slug}</code>,
                },
                {
                  key: 'status',
                  header: 'Statut',
                  cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
                },
                {
                  key: 'order',
                  header: 'Ordre',
                  cell: (row) => row.display_order,
                },
              ]}
            />
          </div>
        </div>

        {/* Form — collapsed on mobile, expanded card on desktop */}
        <div className="lg:col-span-1 lg:order-1 order-2">
          {/* Mobile — accordion (collapsed by default since browsing is primary task) */}
          <div className="lg:hidden">
            <AdminAccordion
              title="Ajouter une catégorie"
              description="Créer une nouvelle catégorie de produits"
              icon={<FolderTree className="w-4 h-4" />}
            >
              <CategoriesForm categories={categories} />
            </AdminAccordion>
          </div>

          {/* Desktop — always-visible card */}
          <div className="hidden lg:block bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Ajouter une catégorie</h2>
            <CategoriesForm categories={categories} />
          </div>
        </div>
      </div>
    </div>
  );
}
