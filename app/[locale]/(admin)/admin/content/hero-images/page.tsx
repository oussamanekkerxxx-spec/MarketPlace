import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/PageHeader';
import type { Metadata } from 'next';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { HeroImageForm } from '@/components/admin/HeroImageForm';
import { AdminAccordion } from '@/components/admin/AdminAccordion';
import { ImageIcon, Pencil } from 'lucide-react';
import { Link } from '@/lib/i18n/navigation';
import { DeleteHeroImageButton } from '@/components/admin/DeleteHeroImageButton';

export const metadata: Metadata = {
  title: 'Images du hero',
};

export default async function HeroImagesPage() {
  const supabase = await createClient();

  type HeroImageRow = {
    id: string;
    url: string;
    alt_text: string | null;
    display_order: number;
    is_active: boolean;
  };

  const { data: itemsRaw } = await supabase
    .from('hero_images')
    .select('*')
    .order('display_order', { ascending: true });

  const items = (itemsRaw as HeroImageRow[] | null) || [];
  const activeItems = items.filter((it) => it.is_active);

  return (
    <div>
      <PageHeader
        title="Images du hero"
        description={`${items.length}/4 image${items.length > 1 ? 's' : ''} · ${activeItems.length} active${activeItems.length > 1 ? 's' : ''}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6">
        {/* List — first on mobile */}
        <div className="lg:col-span-2 lg:order-2 order-1">
          {/* Mobile cards */}
          <div className="lg:hidden space-y-2">
            {items.length === 0 ? (
              <div className="bg-white rounded-xl border p-6 text-center text-sm text-gray-500">
                Aucune image configurée
              </div>
            ) : (
              items.map((it) => (
                <div
                  key={it.id}
                  className="bg-white rounded-xl border shadow-sm p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.url}
                        alt={it.alt_text || ''}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          Image #{it.display_order}
                        </p>
                        <StatusBadge status={it.is_active ? 'active' : 'inactive'} />
                      </div>
                      {it.alt_text && (
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                          {it.alt_text}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <Link
                          href={`/admin/content/hero-images/${it.id}/edit` as '/admin/content/hero-images/[id]/edit'}
                          className="inline-flex items-center gap-1 text-[11px] text-orange-600 hover:underline"
                        >
                          <Pencil className="w-3 h-3" />
                          Modifier
                        </Link>
                        <DeleteHeroImageButton id={it.id} label="Supprimer" />
                      </div>
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
              emptyMessage="Aucune image configurée"
              columns={[
                { key: 'order', header: 'Ordre', cell: (row) => row.display_order },
                {
                  key: 'preview',
                  header: 'Aperçu',
                  cell: (row) => (
                    <div className="relative w-16 h-10 rounded overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.url}
                        alt={row.alt_text || ''}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ),
                },
                {
                  key: 'alt',
                  header: 'Texte alternatif',
                  cell: (row) => <p className="text-sm text-gray-600">{row.alt_text || '-'}</p>,
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
                        href={`/admin/content/hero-images/${row.id}/edit` as '/admin/content/hero-images/[id]/edit'}
                        className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:underline"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Modifier
                      </Link>
                      <DeleteHeroImageButton id={row.id} />
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
              title="Ajouter une image"
              description="Ajouter une nouvelle image au slider (max 4)"
              icon={<ImageIcon className="w-4 h-4" />}
            >
              <HeroImageForm existingCount={items.length} />
            </AdminAccordion>
          </div>
          <div className="hidden lg:block bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-4">Ajouter une image</h2>
            <p className="text-sm text-gray-500 mb-4">
              {items.length}/4 images · {items.length >= 4 ? 'Maximum atteint' : `${4 - items.length} restante(s)`}
            </p>
            <HeroImageForm existingCount={items.length} />
          </div>
        </div>
      </div>
    </div>
  );
}
