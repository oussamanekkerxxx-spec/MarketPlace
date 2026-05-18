'use client';

import { useState } from 'react';
import { Link } from '@/lib/i18n/navigation';
import { Phone, MessageCircle, ChevronRight, StickyNote } from 'lucide-react';
import { StatusSelect } from './StatusSelect';
import { BulkActionBar, OrderCheckbox } from './BulkActionBar';
import { getPhoneHref, getWhatsAppHref } from '@/lib/utils/contact';

interface Order {
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
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  no_answer: 'bg-gray-100 text-gray-700',
  fake: 'bg-red-100 text-red-800',
  returned: 'bg-orange-100 text-orange-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  no_answer: 'Pas de réponse',
  fake: 'Fausse',
  returned: 'Retournée',
};

export function OrdersTableClient({ orders }: { orders: Order[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.length === orders.length ? [] : orders.map((o) => o.id)
    );
  };

  const handleUpdated = () => {
    setSelected([]);
    setRefreshKey((k) => k + 1);
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-8 text-center text-gray-500">
        Aucune commande
      </div>
    );
  }

  return (
    <div key={refreshKey}>
      <BulkActionBar
        orderIds={orders.map((o) => o.id)}
        selected={selected}
        onToggle={toggle}
        onToggleAll={toggleAll}
        onUpdated={handleUpdated}
      />

      {/* Mobile — card list */}
      <div className="lg:hidden space-y-2">
        {orders.map((order) => {
          const statusClass = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700';
          const statusLabel = STATUS_LABELS[order.status] || order.status;
          const productTitle = order.order_items?.[0]?.product_title_snapshot;
          const orderDate = new Date(order.created_at);
          const phoneHref = getPhoneHref(order.customer_phone);
          const whatsappHref = getWhatsAppHref(
            order.customer_phone,
            `Bonjour ${order.customer_name}, je confirme votre commande ${order.order_number}`
          );
          return (
            <div
              key={order.id}
              className="bg-white rounded-xl border shadow-sm overflow-hidden"
            >
              {/* Row 1: checkbox + order number + status */}
              <div className="flex items-center gap-3 px-3 py-2.5 border-b bg-gray-50">
                <OrderCheckbox
                  id={order.id}
                  selected={selected.includes(order.id)}
                  onToggle={toggle}
                />
                <Link
                  href={`/admin/orders/${order.id}` as '/admin/orders/[id]'}
                  className="flex-1 text-sm font-semibold text-orange-700 truncate"
                >
                  {order.order_number}
                </Link>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusClass}`}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Body */}
              <Link
                href={`/admin/orders/${order.id}` as '/admin/orders/[id]'}
                className="block px-3 py-3 active:bg-gray-50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {order.customer_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {order.customer_city_name}
                    </p>
                    {productTitle && (
                      <p className="text-xs text-gray-600 truncate mt-1.5">
                        {productTitle}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900">
                      {order.total} {order.currency}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {orderDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 mt-1 shrink-0" />
                </div>
              </Link>

              {/* Footer actions */}
              <div className="px-3 py-2 border-t bg-gray-50 flex items-center gap-2">
                {phoneHref ? (
                  <a
                    href={phoneHref}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold bg-white border text-gray-700 active:scale-95 transition-transform"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="w-3.5 h-3.5 text-green-600" />
                    Appeler
                  </a>
                ) : (
                  <span className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold bg-white border text-gray-300">
                    <Phone className="w-3.5 h-3.5" />
                    Appeler
                  </span>
                )}
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold bg-white border text-gray-700 active:scale-95 transition-transform"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                    WhatsApp
                  </a>
                ) : (
                  <span className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold bg-white border text-gray-300">
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </span>
                )}
                {order.admin_notes && (
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-white border text-gray-400"
                    title={order.admin_notes}
                  >
                    <StickyNote className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Spacer so the sticky bulk-action bar doesn't cover the last card */}
        {selected.length > 0 && (
          <div className="h-28" aria-hidden="true" />
        )}
      </div>

      {/* Desktop — original table */}
      <div className="hidden lg:block bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 w-10">
                  <OrderCheckbox id="all" selected={selected.length === orders.length && orders.length > 0} onToggle={toggleAll} />
                </th>
                <th className="px-6 py-3 text-left font-medium whitespace-nowrap">N° Commande</th>
                <th className="px-6 py-3 text-left font-medium whitespace-nowrap">Date</th>
                <th className="px-6 py-3 text-left font-medium whitespace-nowrap">Client</th>
                <th className="px-6 py-3 text-left font-medium whitespace-nowrap">Téléphone</th>
                <th className="px-6 py-3 text-left font-medium whitespace-nowrap">Produit</th>
                <th className="px-6 py-3 text-left font-medium whitespace-nowrap">Total</th>
                <th className="px-6 py-3 text-left font-medium whitespace-nowrap">Statut</th>
                <th className="px-6 py-3 text-left font-medium whitespace-nowrap"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <OrderCheckbox id={order.id} selected={selected.includes(order.id)} onToggle={toggle} />
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <Link href={`/admin/orders/${order.id}` as '/admin/orders/[id]'} className="text-orange-600 hover:text-orange-700">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <div>{new Date(order.created_at).toLocaleDateString('fr-FR')}</div>
                    <div className="text-gray-500">{new Date(order.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.customer_name}</div>
                    <div className="text-xs text-gray-500">{order.customer_city_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span>{order.customer_phone}</span>
                      {getPhoneHref(order.customer_phone) ? (
                        <a href={getPhoneHref(order.customer_phone) || undefined} className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors" title="Appeler">
                          <Phone className="w-4 h-4" />
                        </a>
                      ) : null}
                      {getWhatsAppHref(order.customer_phone, `Bonjour ${order.customer_name}, je confirme votre commande ${order.order_number}`) ? (
                        <a
                          href={getWhatsAppHref(order.customer_phone, `Bonjour ${order.customer_name}, je confirme votre commande ${order.order_number}`) || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-green-500 hover:bg-green-50 rounded transition-colors"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-[200px] truncate text-xs">
                    {order.order_items?.[0]?.product_title_snapshot || '-'}
                  </td>
                  <td className="px-6 py-4 font-medium">{order.total} {order.currency}</td>
                  <td className="px-6 py-4">
                    <StatusSelect orderId={order.id} currentStatus={order.status} />
                  </td>
                  <td className="px-6 py-4">
                    {order.admin_notes ? (
                      <span className="text-xs text-gray-400" title={order.admin_notes}>📝</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
