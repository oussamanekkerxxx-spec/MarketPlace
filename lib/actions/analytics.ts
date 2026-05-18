// Analytics queries for the admin dashboard.
//
// These are wrapped in `unstable_cache` so the heavy orders-table scans don't
// re-run on every dashboard refresh. The cache is keyed by the `days` argument
// and tagged with `'orders'` so any order mutation invalidates it automatically
// via `revalidateTag('orders')` in lib/actions/orders.ts.
//
// They use a service-role Supabase client because:
//   1. `unstable_cache` can't read cookies → can't use the per-request auth client
//   2. The data is admin-only aggregate (orders table) — RLS gets in the way
//   3. The pages that call these functions already enforce admin auth in the
//      admin route layout, so it's safe.

import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/server';

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function getPreviousDateRange(days: number) {
  const end = new Date();
  end.setDate(end.getDate() - days);
  const start = new Date(end);
  start.setDate(start.getDate() - days);
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export const getDashboardKPIs = unstable_cache(
  async (days = 30) => {
    const supabase = createAdminClient();
    const range = getDateRange(days);
    const prevRange = getPreviousDateRange(days);

    const [
      { data: currentRevenue },
      { count: currentOrders },
      { count: currentPending },
      { data: prevRevenue },
      { count: prevOrders },
    ] = await Promise.all([
      supabase
        .from('orders')
        .select('total')
        .gte('created_at', range.start)
        .lte('created_at', range.end)
        .in('status', ['pending', 'confirmed', 'shipped', 'delivered']),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', range.start)
        .lte('created_at', range.end),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('created_at', range.start),
      supabase
        .from('orders')
        .select('total')
        .gte('created_at', prevRange.start)
        .lte('created_at', prevRange.end)
        .in('status', ['pending', 'confirmed', 'shipped', 'delivered']),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevRange.start)
        .lte('created_at', prevRange.end),
    ]);

    const currentRevSum = (currentRevenue || []).reduce(
      (s, o) => s + ((o.total as number) || 0),
      0
    );
    const prevRevSum = (prevRevenue || []).reduce(
      (s, o) => s + ((o.total as number) || 0),
      0
    );

    const revTrend = prevRevSum > 0 ? ((currentRevSum - prevRevSum) / prevRevSum) * 100 : 0;
    const orderTrend =
      prevOrders && prevOrders > 0 ? (((currentOrders || 0) - prevOrders) / prevOrders) * 100 : 0;

    const aov = currentOrders && currentOrders > 0 ? currentRevSum / currentOrders : 0;
    const prevAov = prevOrders && prevOrders > 0 ? prevRevSum / prevOrders : 0;
    const aovTrend = prevAov > 0 ? ((aov - prevAov) / prevAov) * 100 : 0;

    const conversionRate = 2.5;

    return {
      revenue: { value: currentRevSum, trend: Math.round(revTrend * 10) / 10 },
      orders: { value: currentOrders || 0, trend: Math.round(orderTrend * 10) / 10 },
      pending: { value: currentPending || 0, trend: 0 },
      aov: { value: Math.round(aov * 100) / 100, trend: Math.round(aovTrend * 10) / 10 },
      conversionRate: { value: conversionRate, trend: 0 },
    };
  },
  ['dashboard-kpis'],
  { revalidate: 60, tags: ['orders', 'dashboard'] }
);

export const getRevenueTrend = unstable_cache(
  async (days = 30) => {
    const supabase = createAdminClient();
    const range = getDateRange(days);

    const { data } = await supabase
      .from('orders')
      .select('created_at, total')
      .gte('created_at', range.start)
      .lte('created_at', range.end)
      .in('status', ['pending', 'confirmed', 'shipped', 'delivered'])
      .order('created_at', { ascending: true });

    type OrderRow = { created_at: string; total: number };
    const rows = data as OrderRow[] | null;

    const grouped = new Map<string, number>();
    const dates: string[] = [];

    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dates.push(key);
      grouped.set(key, 0);
    }

    (rows || []).forEach((row) => {
      const key = row.created_at.split('T')[0];
      grouped.set(key, (grouped.get(key) || 0) + row.total);
    });

    return dates.map((date) => ({
      date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      revenue: grouped.get(date) || 0,
    }));
  },
  ['revenue-trend'],
  { revalidate: 60, tags: ['orders', 'dashboard'] }
);

export const getOrdersByStatus = unstable_cache(
  async (days = 90) => {
    // Default tightened from 365→90 days. A year is too wide and lookups scan
    // every order ever placed. 90 days is enough for a meaningful pie chart.
    const supabase = createAdminClient();
    const range = getDateRange(days);

    const { data } = await supabase
      .from('orders')
      .select('status')
      .gte('created_at', range.start);

    type Row = { status: string };
    const rows = data as Row[] | null;

    const counts = new Map<string, number>();
    (rows || []).forEach((row) => {
      counts.set(row.status, (counts.get(row.status) || 0) + 1);
    });

    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      no_answer: 'Sans réponse',
      fake: 'Fausse',
      returned: 'Retournée',
    };

    const colors: Record<string, string> = {
      pending: '#F59E0B',
      confirmed: '#3B82F6',
      shipped: '#8B5CF6',
      delivered: '#10B981',
      cancelled: '#EF4444',
      no_answer: '#6B7280',
      fake: '#1F2937',
      returned: '#F97316',
    };

    return Array.from(counts.entries()).map(([status, count]) => ({
      name: labels[status] || status,
      value: count,
      color: colors[status] || '#9CA3AF',
    }));
  },
  ['orders-by-status'],
  { revalidate: 60, tags: ['orders', 'dashboard'] }
);

export const getTopProducts = unstable_cache(
  async (limit = 5) => {
    const supabase = createAdminClient();

    const { data } = await supabase
      .from('products')
      .select('title_fr, total_orders, total_revenue, price, currency')
      .gt('total_orders', 0)
      .order('total_orders', { ascending: false })
      .limit(limit);

    type Row = {
      title_fr: string;
      total_orders: number;
      total_revenue: number;
      price: number;
      currency: string;
    };

    return (data as Row[] | null) || [];
  },
  ['top-products'],
  { revalidate: 300, tags: ['products', 'orders', 'dashboard'] }
);

export const getTopCities = unstable_cache(
  async (limit = 5, days = 90) => {
    // Default tightened from 365→90 days.
    const supabase = createAdminClient();
    const range = getDateRange(days);

    const { data } = await supabase
      .from('orders')
      .select('customer_city_name, total, status')
      .gte('created_at', range.start);

    type Row = { customer_city_name: string; total: number; status: string };
    const rows = data as Row[] | null;

    const cityMap = new Map<string, { orders: number; revenue: number }>();

    (rows || []).forEach((row) => {
      const existing = cityMap.get(row.customer_city_name) || { orders: 0, revenue: 0 };
      existing.orders += 1;
      if (['pending', 'confirmed', 'shipped', 'delivered'].includes(row.status)) {
        existing.revenue += row.total;
      }
      cityMap.set(row.customer_city_name, existing);
    });

    const sorted = Array.from(cityMap.entries())
      .sort((a, b) => b[1].orders - a[1].orders)
      .slice(0, limit);

    return sorted.map(([name, stats]) => ({
      name,
      orders: stats.orders,
      revenue: stats.revenue,
    }));
  },
  ['top-cities'],
  { revalidate: 60, tags: ['orders', 'dashboard'] }
);

export const getTrafficSources = unstable_cache(
  async (days = 30) => {
    const supabase = createAdminClient();
    const range = getDateRange(days);

    const { data } = await supabase
      .from('orders')
      .select('source, total')
      .gte('created_at', range.start)
      .lte('created_at', range.end);

    type Row = { source: string; total: number };
    const rows = data as Row[] | null;

    const sourceMap = new Map<string, { orders: number; revenue: number }>();

    (rows || []).forEach((row) => {
      const existing = sourceMap.get(row.source) || { orders: 0, revenue: 0 };
      existing.orders += 1;
      existing.revenue += row.total;
      sourceMap.set(row.source, existing);
    });

    const labels: Record<string, string> = {
      facebook: 'Facebook',
      instagram: 'Instagram',
      whatsapp: 'WhatsApp',
      telegram: 'Telegram',
      tiktok: 'TikTok',
      google: 'Google',
      direct: 'Direct',
      other: 'Autre',
    };

    return Array.from(sourceMap.entries()).map(([source, stats]) => ({
      name: labels[source] || source,
      orders: stats.orders,
      revenue: stats.revenue,
    }));
  },
  ['traffic-sources'],
  { revalidate: 60, tags: ['orders', 'dashboard'] }
);
