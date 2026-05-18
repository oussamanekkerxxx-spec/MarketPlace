import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/PageHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Villes',
};
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { CitiesForm } from '@/components/admin/CitiesForm';
import { AdminAccordion } from '@/components/admin/AdminAccordion';
import { MapPin } from 'lucide-react';

export default async function CitiesPage() {
  const supabase = await createClient();

  type CityRow = {
    id: string;
    name_fr: string;
    name_en: string;
    name_ar: string;
    shipping_fee: number;
    estimated_days: number;
    is_active: boolean;
    display_order: number;
  };

  const { data: citiesRaw } = await supabase
    .from('cities')
    .select('*')
    .order('display_order', { ascending: true });

  const cities = (citiesRaw as CityRow[] | null) || [];

  return (
    <div>
      <PageHeader
        title="Villes de livraison"
        description={`${cities.length} ville${cities.length > 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
        {/* List — first on mobile */}
        <div className="lg:col-span-2 lg:order-2 order-1">
          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {cities.length === 0 ? (
              <div className="bg-white rounded-xl border p-6 text-center text-sm text-gray-500">
                Aucune ville configurée
              </div>
            ) : (
              cities.map((c) => (
                <div
                  key={c.id}
                  className="bg-white rounded-xl border shadow-sm p-3 flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {c.name_fr}
                      </p>
                      <StatusBadge status={c.is_active ? 'active' : 'inactive'} />
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {c.name_en} · {c.name_ar}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-600">
                      <span><strong className="text-gray-800">{c.shipping_fee}</strong> MAD</span>
                      <span><strong className="text-gray-800">{c.estimated_days}</strong> jours</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block">
            <DataTable
              data={cities}
              keyExtractor={(row) => row.id}
              emptyMessage="Aucune ville configurée"
              columns={[
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
                { key: 'shipping', header: 'Frais', cell: (row) => `${row.shipping_fee} MAD` },
                { key: 'days', header: 'Jours', cell: (row) => row.estimated_days },
                {
                  key: 'status',
                  header: 'Statut',
                  cell: (row) => <StatusBadge status={row.is_active ? 'active' : 'inactive'} />,
                },
                { key: 'order', header: 'Ordre', cell: (row) => row.display_order },
              ]}
            />
          </div>
        </div>

        {/* Form — accordion on mobile */}
        <div className="lg:col-span-1 lg:order-1 order-2">
          <div className="lg:hidden">
            <AdminAccordion
              title="Ajouter une ville"
              description="Configurer une nouvelle ville de livraison"
              icon={<MapPin className="w-4 h-4" />}
            >
              <CitiesForm />
            </AdminAccordion>
          </div>
          <div className="hidden lg:block bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Ajouter une ville</h2>
            <CitiesForm />
          </div>
        </div>
      </div>
    </div>
  );
}
