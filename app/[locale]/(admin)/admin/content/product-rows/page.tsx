import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/PageHeader';
import type { Metadata } from 'next';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ProductRowForm } from '@/components/admin/ProductRowForm';
import { AdminAccordion } from '@/components/admin/AdminAccordion';
import { Rows3, Pencil } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { DeleteProductRowButton } from '@/components/admin/DeleteProductRowButton';

export const metadata: Metadata = {
  title: 'Sections produits',
};

export default async function ProductRowsPage() {
  const supabase = await createClient();

  type ProductRowRow = {
    id: string;
    slug: string;
    title_fr: string;
    title_en: string | null;
    title_ar: string | null;
    subtitle_fr: string | null;
    subtitle_en: string | null;
    subtitle_ar: string | null;
    display_order: number;
    is_active: boolean;
  };

  const { data: rowsRaw } = await supabase
    .from('product_rows')
    .select('*')
    .order('display_order', { ascending: true });

  const rows = (rowsRaw as ProductRowRow[] | null) || [];
  const activeRows = rows.filter((r) => r.is_active);

  return (
    <div>
      <PageHeader
        title="Sections produits"
        description={`${rows.length} section${rows.length > 1 ? 's' : ''} · ${activeRows.length} active${activeRows.length > 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
        {/* List — first on mobile */}
        <div className="lg:col-span-2 lg:order-2 order-1">
          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {rows.length === 0 ? (
              <div className="bg-white rounded-xl border p-6 text-center text-sm text-gray-500">
                Aucune section configurée
              </div>
            ) : (
              rows.map((row) => (
                <div
                  key={row.id}
                  className="bg-white rounded-xl border shadow-sm p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {row.title_fr}
                      </p>
                      <p className="text-xs text-gray-500">/{row.slug}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Ordre: {row.display_order}
                      </p>
                    </div>
                    <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <Link
                      href={`/admin/content/product-rows/${row.id}/edit` as '/admin/content/product-rows/[id]/edit'}
                      className="inline-flex items-center gap-1 text-[11px] text-orange-600 hover:underline"
                    >
                      <Pencil className="w-3 h-3" />
                      Modifier
                    </Link>
                    <DeleteProductRowButton id={row.id} label="Supprimer" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block">
            <DataTable
              data={rows}
              keyExtractor={(row) => row.id}
              emptyMessage="Aucune section configurée"
              columns={[
                { key: 'order', header: 'Ordre', cell: (row) => row.display_order },
                {
                  key: 'title',
                  header: 'Titre',
                  cell: (row) => (
                    <div>
                      <div className="font-medium">{row.title_fr}</div>
                      <div className="text-xs text-gray-500">{row.title_en} · {row.title_ar}</div>
                    </div>
                  ),
                },
                {
                  key: 'slug',
                  header: 'Slug',
                  cell: (row) => <code className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">/{row.slug}</code>,
                },
                {
                  key: 'status',
                  header: 'Statut',
                  cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
                },
                {
                  key: 'actions',
                  header: '',
                  cell: (row) => (
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/content/product-rows/${row.id}/edit` as '/admin/content/product-rows/[id]/edit'}
                        className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:underline"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Modifier
                      </Link>
                      <DeleteProductRowButton id={row.id} />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        {/* Form — accordion on mobile */}
        <div className="lg:col-span-1 lg:order-1 order-2">
          <div className="lg:hidden">
            <AdminAccordion
              title="Ajouter une section"
              description="Créer une nouvelle ligne de produits"
              icon={<Rows3 className="w-4 h-4" />}
            >
              <ProductRowForm />
            </AdminAccordion>
          </div>
          <div className="hidden lg:block bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Ajouter une section</h2>
            <ProductRowForm />
          </div>
        </div>
      </div>
    </div>
  );
}
