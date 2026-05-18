'use client';

import { ShoppingCart, DollarSign, Clock, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPIs {
  revenue: { value: number; trend: number };
  orders: { value: number; trend: number };
  pending: { value: number; trend: number };
  aov: { value: number; trend: number };
}

export function AnalyticsCards({ kpis }: { kpis: KPIs }) {
  const cards = [
    {
      label: 'Revenus (30j)',
      value: `${kpis.revenue.value.toFixed(0)} MAD`,
      trend: kpis.revenue.trend,
      icon: DollarSign,
      color: 'bg-emerald-50 text-emerald-700',
      iconBg: 'bg-emerald-100',
    },
    {
      label: 'Commandes (30j)',
      value: String(kpis.orders.value),
      trend: kpis.orders.trend,
      icon: ShoppingCart,
      color: 'bg-blue-50 text-blue-700',
      iconBg: 'bg-blue-100',
    },
    {
      label: 'En attente',
      value: String(kpis.pending.value),
      trend: kpis.pending.trend,
      icon: Clock,
      color: 'bg-orange-50 text-orange-700',
      iconBg: 'bg-orange-100',
    },
    {
      label: 'Panier moyen',
      value: `${kpis.aov.value.toFixed(0)} MAD`,
      trend: kpis.aov.trend,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-700',
      iconBg: 'bg-purple-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-lg lg:rounded-xl border p-3 lg:p-6"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] lg:text-sm font-medium text-gray-500 truncate">
                {card.label}
              </p>
              <p className="text-lg lg:text-2xl font-bold text-gray-900 mt-0.5 lg:mt-1 truncate">
                {card.value}
              </p>
              {card.trend !== 0 && (
                <div
                  className={`flex items-center gap-0.5 lg:gap-1 mt-1 lg:mt-2 text-[11px] lg:text-sm font-medium ${
                    card.trend >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {card.trend >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 lg:w-4 lg:h-4 shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 lg:w-4 lg:h-4 shrink-0" />
                  )}
                  <span>{Math.abs(card.trend).toFixed(1)}%</span>
                  <span className="text-gray-400 font-normal hidden lg:inline">
                    vs période précédente
                  </span>
                </div>
              )}
            </div>
            <div className={`p-2 lg:p-3 rounded-lg shrink-0 ${card.iconBg} ${card.color}`}>
              <card.icon className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
