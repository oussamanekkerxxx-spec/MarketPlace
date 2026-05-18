'use client';

import { Package } from 'lucide-react';

interface Product {
  title_fr: string;
  total_orders: number;
  total_revenue: number;
  price: number;
  currency: string;
}

export function TopProductsTable({ products }: { products: Product[] }) {
  return (
    <div className="bg-white rounded-xl border">
      <div className="p-6 border-b">
        <h3 className="text-base font-semibold text-gray-900">Top produits</h3>
      </div>
      <div className="divide-y">
        {products.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">
            <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            Aucune vente enregistrée
          </div>
        )}
        {products.map((product, i) => (
          <div key={product.title_fr} className="px-6 py-4 flex items-center gap-4">
            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center flex-shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{product.title_fr}</p>
              <p className="text-xs text-gray-500">{product.total_orders} commandes</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {product.total_revenue.toFixed(0)} {product.currency}
              </p>
              <p className="text-xs text-gray-500">{product.price.toFixed(0)} {product.currency} / unité</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
