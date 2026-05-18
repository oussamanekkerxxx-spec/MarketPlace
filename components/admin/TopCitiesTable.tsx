'use client';

import { MapPin } from 'lucide-react';

interface City {
  name: string;
  orders: number;
  revenue: number;
}

export function TopCitiesTable({ cities }: { cities: City[] }) {
  const maxOrders = Math.max(...cities.map((c) => c.orders), 1);

  return (
    <div className="bg-white rounded-xl border">
      <div className="p-6 border-b">
        <h3 className="text-base font-semibold text-gray-900">Top villes</h3>
      </div>
      <div className="divide-y">
        {cities.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">
            <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            Aucune commande enregistrée
          </div>
        )}
        {cities.map((city, i) => (
          <div key={city.name} className="px-6 py-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-sm font-medium text-gray-900">{city.name}</span>
              <span className="text-xs text-gray-500 ml-auto">{city.orders} commandes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-orange-400"
                  style={{ width: `${(city.orders / maxOrders) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 w-16 text-right">
                {city.revenue.toFixed(0)} MAD
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
