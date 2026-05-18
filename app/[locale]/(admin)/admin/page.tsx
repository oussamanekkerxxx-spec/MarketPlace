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
  title: 'Tableau de bord',
};
import { AnalyticsCards } from '@/components/admin/AnalyticsCards';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { StatusChart } from '@/components/admin/StatusChart';
import { TopProductsTable } from '@/components/admin/TopProductsTable';
import { TopCitiesTable } from '@/components/admin/TopCitiesTable';
import { SourceBreakdown } from '@/components/admin/SourceBreakdown';
import { PeriodSelector } from '@/components/admin/PeriodSelector';
import { createClient } from '@/lib/supabase/server';
import { StatusSelect } from '@/components/admin/StatusSelect';
import { Link } from '@/lib/i18n/navigation';
import { Phone, MessageCircle } from 'lucide-react';

export default async function AdminDashboardPage({
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
    getOrdersByStatus(days),
    getTopProducts(5),
    getTopCities(5, days),
    getTrafficSources(days),
  ]);

  // Recent orders
  const supabase = await createClient();
  type OrderRow = {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    status: string;
    total: number;
    created_at: string;
  };

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, customer_phone, status, total, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const orders = recentOrders as OrderRow[] | null;

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <PeriodSelector />
      </div>

      {/* KPI Cards */}
      <AnalyticsCards kpis={kpis} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueTrend} />
        <StatusChart data={statusDistribution} />
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsTable products={topProducts} />
        <TopCitiesTable cities={topCities} />
      </div>

      {/* Traffic Sources */}
      <SourceBreakdown data={trafficSources} />

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="px-4 lg:px-6 py-3 lg:py-4 border-b flex items-center justify-between">
          <h2 className="text-base lg:text-lg font-semibold text-gray-900">Commandes récentes</h2>
          <Link
            href="/admin/orders"
            className="text-xs lg:text-sm font-medium text-orange-600 hover:text-orange-700"
          >
            Tout voir →
          </Link>
        </div>

        {/* Mobile — card list */}
        <div className="lg:hidden divide-y">
          {orders?.map((order) => (
            <Link
              key={order.id}
              href={`/admin/orders/${order.id}`}
              className="block px-4 py-3 active:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-orange-700 truncate">
                      {order.order_number}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {new Date(order.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 truncate">{order.customer_name}</p>
                  <p className="text-xs text-gray-500 truncate">{order.customer_phone}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-gray-900">{order.total} MAD</p>
                  <p className="text-[11px] text-gray-500 mt-0.5 capitalize">{order.status}</p>
                </div>
              </div>
            </Link>
          ))}
          {!orders?.length && (
            <div className="px-4 py-8 text-center text-sm text-gray-500">
              Aucune commande pour le moment
            </div>
          )}
        </div>

        {/* Desktop — original table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-6 py-3 text-left font-medium">N° Commande</th>
                <th className="px-6 py-3 text-left font-medium">Client</th>
                <th className="px-6 py-3 text-left font-medium">Téléphone</th>
                <th className="px-6 py-3 text-left font-medium">Statut</th>
                <th className="px-6 py-3 text-left font-medium">Total</th>
                <th className="px-6 py-3 text-left font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders?.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    <Link href={`/admin/orders/${order.id}`} className="text-orange-600 hover:text-orange-700">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4">{order.customer_name}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span>{order.customer_phone}</span>
                      <a href={`tel:${order.customer_phone}`} className="p-1 text-green-600 hover:bg-green-50 rounded">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=Bonjour%20${encodeURIComponent(order.customer_name)},%20je%20confirme%20votre%20commande%20${order.order_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-green-500 hover:bg-green-50 rounded"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusSelect orderId={order.id} currentStatus={order.status} />
                  </td>
                  <td className="px-6 py-4 font-medium">{order.total} MAD</td>
                  <td className="px-6 py-4 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                </tr>
              ))}
              {!orders?.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Aucune commande pour le moment
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
