import {
  getDashboardKPIs,
  getRevenueTrend,
  getOrdersByStatus,
  getTopProducts,
  getTopCities,
  getTrafficSources,
} from '@/lib/actions/analytics';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rapports',
};
import { AnalyticsCards } from '@/components/admin/AnalyticsCards';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { StatusChart } from '@/components/admin/StatusChart';
import { TopProductsTable } from '@/components/admin/TopProductsTable';
import { TopCitiesTable } from '@/components/admin/TopCitiesTable';
import { SourceBreakdown } from '@/components/admin/SourceBreakdown';
import { PeriodSelector } from '@/components/admin/PeriodSelector';
import { CSVExporter } from '@/components/admin/CSVExporter';
import { createClient } from '@/lib/supabase/server';

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: periodParam } = await searchParams;
  const days = Math.min(Math.max(parseInt(periodParam || '30', 10), 1), 365);

  const [
    kpis,
    revenueTrend,
    statusDistribution,
    topProducts,
    topCities,
    trafficSources,
  ] = await Promise.all([
    getDashboardKPIs(days),
    getRevenueTrend(days),
    getOrdersByStatus(),
    getTopProducts(10),
    getTopCities(10),
    getTrafficSources(days),
  ]);

  const supabase = await createClient();

  // Fetch raw orders for CSV export
  type OrderRow = {
    order_number: string;
    customer_name: string;
    customer_phone: string;
    customer_city_name: string;
    status: string;
    total: number;
    currency: string;
    source: string;
    created_at: string;
    order_items: { product_title_snapshot: string; quantity: number }[];
  };

  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('*, order_items(product_title_snapshot, quantity)')
    .order('created_at', { ascending: false })
    .limit(500);

  const orders = ordersRaw as OrderRow[] | null;

  const csvData = (orders || []).map((order) => ({
    'N° Commande': order.order_number,
    'Client': order.customer_name,
    'Téléphone': order.customer_phone,
    'Ville': order.customer_city_name,
    'Produit': order.order_items?.map((i) => i.product_title_snapshot).join(', ') || '',
    'Statut': order.status,
    'Total': `${order.total} ${order.currency}`,
    'Source': order.source,
    'Date': new Date(order.created_at).toLocaleDateString('fr-FR'),
  }));

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Rapports détaillés</h1>
        <div className="flex items-center justify-between gap-2 lg:gap-3">
          <PeriodSelector />
          <CSVExporter data={csvData} filename={`commandes-${days}j.csv`} />
        </div>
      </div>

      <AnalyticsCards kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueTrend} />
        <StatusChart data={statusDistribution} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsTable products={topProducts} />
        <TopCitiesTable cities={topCities} />
      </div>

      <SourceBreakdown data={trafficSources} />
    </div>
  );
}
