import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/PageHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pourquoi nous',
};
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { WhyUsItemForm } from '@/components/admin/WhyUsItemForm';
import { AdminAccordion } from '@/components/admin/AdminAccordion';
import { HelpCircle } from 'lucide-react';

export default async function WhyUsPage() {
  const supabase = await createClient();

  type WhyUsRow = {
    id: string;
    display_order: number;
    number_label_fr: string;
    number_label_en: string | null;
    number_label_ar: string | null;
    title_fr: string;
    title_en: string | null;
    title_ar: string | null;
    text_fr: string;
    text_en: string | null;
    text_ar: string | null;
    is_active: boolean;
  };

  const { data: itemsRaw } = await supabase
    .from('why_us_items')
    .select('*')
    .order('display_order', { ascending: true });

  const items = (itemsRaw as WhyUsRow[] | null) || [];

  return (
    <div>
      <PageHeader
        title="Pourquoi nous choisir ?"
        description={`${items.length} élément${items.length > 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
        {/* List — first on mobile */}
        <div className="lg:col-span-2 lg:order-2 order-1">
          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {items.length === 0 ? (
              <div className="bg-white rounded-xl border p-6 text-center text-sm text-gray-500">
                Aucun élément configuré
              </div>
            ) : (
              items.map((it) => (
                <div
                  key={it.id}
                  className="bg-white rounded-xl border shadow-sm p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {it.number_label_fr || it.display_order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {it.title_fr}
                        </p>
                        <StatusBadge status={it.is_active ? 'active' : 'inactive'} />
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                        {it.text_fr}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block">
            <DataTable
              data={items}
              keyExtractor={(row) => row.id}
              emptyMessage="Aucun élément configuré"
              columns={[
                { key: 'order', header: 'Ordre', cell: (row) => row.display_order },
                {
                  key: 'label',
                  header: 'Label',
                  cell: (row) => (
                    <div>
                      <div className="font-medium">{row.number_label_fr}</div>
                      <div className="text-xs text-gray-500">{row.number_label_en} · {row.number_label_ar}</div>
                    </div>
                  ),
                },
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
                  key: 'text',
                  header: 'Texte',
                  cell: (row) => <p className="text-sm text-gray-600 line-clamp-2">{row.text_fr}</p>,
                },
                {
                  key: 'status',
                  header: 'Statut',
                  cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
                },
              ]}
            />
          </div>
        </div>

        {/* Form — accordion on mobile */}
        <div className="lg:col-span-1 lg:order-1 order-2">
          <div className="lg:hidden">
            <AdminAccordion
              title="Ajouter un élément"
              description="Créer un nouveau bloc « Pourquoi nous »"
              icon={<HelpCircle className="w-4 h-4" />}
            >
              <WhyUsItemForm />
            </AdminAccordion>
          </div>
          <div className="hidden lg:block bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Ajouter un élément</h2>
            <WhyUsItemForm />
          </div>
        </div>
      </div>
    </div>
  );
}
