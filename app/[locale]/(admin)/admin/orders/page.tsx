import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/admin/PageHeader';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commandes',
};
import { OrderFilters } from '@/components/admin/OrderFilters';
import { CSVExporter } from '@/components/admin/CSVExporter';
import { OrdersTableClient } from '@/components/admin/OrdersTableClient';

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; city?: string; phone?: string; order?: string }>;
}) {
  const { status, city, phone, order: orderQuery } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, customer_city_name, total, currency, status, created_at, admin_notes, order_items(product_title_snapshot, unit_price_at_order, quantity)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) query = query.eq('status', status);
  if (city) query = query.eq('customer_city_name', city);
  if (phone) query = query.ilike('customer_phone', `%${phone}%`);
  if (orderQuery) query = query.ilike('order_number', `%${orderQuery}%`);

  const { data: ordersRaw } = await query;

  const { data: citiesRaw } = await supabase
    .from('cities')
    .select('name_fr')
    .eq('is_active', true)
    .order('name_fr');

  type OrderRow = {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_city_name: string;
    total: number;
    currency: string;
    status: string;
    created_at: string;
    admin_notes: string | null;
    order_items: Array<{
      product_title_snapshot: string;
      unit_price_at_order: number;
      quantity: number;
    }> | null;
  };

  const orders = ordersRaw as OrderRow[] | null;
  const cities = citiesRaw as Array<{ name_fr: string }> | null;

  // Flatten order_items for CSV export
  const exportData = (orders || []).map((o) => ({
    ...o,
    product_title: o.order_items?.[0]?.product_title_snapshot || '',
    quantity: o.order_items?.[0]?.quantity || 1,
    unit_price: o.order_items?.[0]?.unit_price_at_order || '',
  }));

  return (
    <div>
      <PageHeader
        title="Commandes"
        action={<CSVExporter data={exportData} />}
      />

      <OrderFilters cities={cities || []} />

      <OrdersTableClient orders={orders || []} />
    </div>
  );
}
