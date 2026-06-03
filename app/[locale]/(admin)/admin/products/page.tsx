import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/PageHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Produits',
};
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Link } from '@/lib/i18n/navigation';
import Image from 'next/image';
import { Plus, Star, ExternalLink } from 'lucide-react';
import { DeleteProductButton } from '@/components/admin/DeleteProductButton';
import { ProductQRCode } from '@/components/admin/ProductQRCode';

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();

  type ProductImageRow = { url: string; is_primary: boolean };

  type ProductRow = {
    id: string;
    slug: string;
    title_fr: string;
    product_images: ProductImageRow[] | null;
    price: number;
    compare_at_price: number | null;
    currency: string;
    stock_quantity: number;
    low_stock_threshold: number;
    is_active: boolean;
    is_featured: boolean;
    categories: { name_fr: string } | null;
  };

  const { data: productsRaw } = await supabase
    .from('products')
    .select('*, categories(name_fr), product_images(url, is_primary)')
    .order('created_at', { ascending: false });

  const products = (productsRaw as ProductRow[] | null) || [];

  return (
    <div>
      <PageHeader
        title="Produits"
        description={`${products.length} produit${products.length > 1 ? 's' : ''}`}
        action={
          <Link
            href="/admin/products/new"
            className="inline-flex items-center justify-center gap-1.5 w-full lg:w-auto px-4 py-2.5 lg:py-2 bg-orange-600 text-white rounded-lg font-semibold text-sm hover:bg-orange-700 active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            Ajouter un produit
          </Link>
        }
      />

      {products.length === 0 ? (
        <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-gray-500">
          Aucun produit
        </div>
      ) : (
        <>
          {/* Mobile — card grid */}
          <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {products.map((p) => {
              const img = p.product_images?.find((i) => i.is_primary)?.url || p.product_images?.[0]?.url;
              const isLowStock = p.stock_quantity <= p.low_stock_threshold;
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border shadow-sm overflow-hidden"
                >
                  <Link
                    href={`/admin/products/${p.id}/edit` as '/admin/products/[id]/edit'}
                    className="block active:scale-[0.98] transition-transform"
                  >
                    <div className="flex gap-3 p-2.5">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {img ? (
                          <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">
                            {p.title_fr?.charAt(0)}
                          </div>
                        )}
                        {p.is_featured && (
                          <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center shadow">
                            <Star className="w-2.5 h-2.5 fill-white" />
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {p.title_fr}
                          </p>
                          <StatusBadge status={p.is_active ? 'active' : 'inactive'} />
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {p.categories?.name_fr || 'Sans catégorie'}
                        </p>
                        <div className="flex items-baseline justify-between mt-1.5 gap-2">
                          <p className="text-sm font-bold text-orange-700">
                            {p.price} {p.currency}
                          </p>
                          <p
                            className={`text-[11px] font-medium ${
                              isLowStock ? 'text-orange-600' : 'text-gray-500'
                            }`}
                          >
                            Stock: {p.stock_quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>

                  {/* Action buttons */}
                  <div className="px-2.5 pb-2.5 pt-0 flex items-center gap-3 border-t border-gray-100">
                    <Link
                      href={`/product/${p.slug}` as '/product/[slug]'}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Voir
                    </Link>
                    <ProductQRCode slug={p.slug} locale={locale} label="QR" />
                    <div className="flex-1" />
                    <DeleteProductButton id={p.id} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop — table */}
          <div className="hidden lg:block">
            <DataTable
              data={products}
              keyExtractor={(row) => row.id}
              emptyMessage="Aucun produit"
              columns={[
                {
                  key: 'image',
                  header: '',
                  cell: (row) => (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden relative">
                      {row.product_images && row.product_images.length > 0 ? (
                        <Image
                          src={row.product_images.find((i) => i.is_primary)?.url || row.product_images[0].url}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {row.title_fr?.charAt(0)}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'title',
                  header: 'Produit',
                  cell: (row) => (
                    <div>
                      <div className="font-medium">{row.title_fr}</div>
                      <div className="text-xs text-gray-500">{row.categories?.name_fr}</div>
                    </div>
                  ),
                },
                {
                  key: 'price',
                  header: 'Prix',
                  cell: (row) => (
                    <div>
                      <span className="font-medium">{row.price} {row.currency}</span>
                      {row.compare_at_price && (
                        <span className="text-xs text-gray-400 line-through ml-2">
                          {row.compare_at_price} {row.currency}
                        </span>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'stock',
                  header: 'Stock',
                  cell: (row) => (
                    <span className={row.stock_quantity <= row.low_stock_threshold ? 'text-orange-600 font-medium' : ''}>
                      {row.stock_quantity}
                    </span>
                  ),
                },
                {
                  key: 'status',
                  header: 'Statut',
                  cell: (row) => (
                    <div className="flex items-center gap-2">
                      <StatusBadge status={row.is_active ? 'active' : 'inactive'} />
                      {row.is_featured && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Vedette</span>}
                    </div>
                  ),
                },
                {
                  key: 'qr',
                  header: '',
                  cell: (row) => (
                    <ProductQRCode slug={row.slug} locale={locale} />
                  ),
                },
                {
                  key: 'actions',
                  header: '',
                  cell: (row) => (
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/products/${row.id}/edit` as '/admin/products/[id]/edit'}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        Modifier
                      </Link>
                      <DeleteProductButton id={row.id} />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
