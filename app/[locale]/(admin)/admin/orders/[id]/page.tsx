import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Détail de commande',
};
import { OrderTimeline } from '@/components/admin/OrderTimeline';
import { StatusSelect } from '@/components/admin/StatusSelect';
import { Link } from '@/lib/i18n/navigation';
import { Phone, MessageCircle, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { UpdateNotesForm } from '@/components/admin/UpdateNotesForm';
import { AnonymizeOrderButton } from '@/components/admin/AnonymizeOrderButton';
import { CopyButton } from '@/components/admin/CopyButton';
import { getPhoneHref, getWhatsAppHref } from '@/lib/utils/contact';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', id)
    .single();

  if (!order) notFound();

  // Get current user role
  const { data: { user } } = await supabase.auth.getUser();
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id || '')
    .single();
  const isAdmin = (currentProfile as { role: string } | null)?.role === 'admin';

  type OrderItem = {
    product_title_snapshot: string;
    product_image_snapshot: string | null;
    unit_price_at_order: number;
    quantity: number;
    line_total: number;
  };

  const orderItem = (order.order_items as OrderItem[] | null)?.[0];
  const phoneHref = getPhoneHref(order.customer_phone as string | null);
  const whatsappHref = getWhatsAppHref(
    order.customer_phone as string | null,
    `Bonjour ${order.customer_name as string}, je confirme votre commande ${order.order_number as string}`
  );

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-5 lg:mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3 lg:mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux commandes
        </Link>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl lg:text-2xl font-bold truncate">{order.order_number as string}</h1>
            <p className="text-gray-500 text-xs lg:text-sm mt-0.5">
              {new Date(order.created_at as string).toLocaleString('fr-FR')}
            </p>
          </div>
          <div className="flex items-center gap-2 lg:gap-3">
            {isAdmin && (
              <AnonymizeOrderButton orderId={id} />
            )}
            <StatusSelect orderId={id} currentStatus={order.status as string} size="md" />
          </div>
        </div>
      </div>

      {/* Timeline (vertical on mobile, horizontal on desktop — no overflow needed) */}
      <div className="bg-white rounded-xl border p-4 lg:p-6 mb-4 lg:mb-6">
        <OrderTimeline
          status={order.status as string}
          timestamps={{
            confirmed_at: order.confirmed_at as string | null,
            shipped_at: order.shipped_at as string | null,
            delivered_at: order.delivered_at as string | null,
            cancelled_at: order.cancelled_at as string | null,
            returned_at: order.returned_at as string | null,
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
        {/* Customer Card */}
        <div className="bg-white rounded-xl border p-4 lg:p-6 space-y-4">
          <h2 className="text-base lg:text-lg font-semibold border-b pb-2">Client</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-500">Nom</p>
              <p className="font-medium">{order.customer_name as string}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Téléphone</p>
              <div className="flex items-center gap-2">
                <p className="font-medium">{order.customer_phone as string}</p>
                <CopyButton text={order.customer_phone as string} />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ville</p>
              <p className="font-medium">{order.customer_city_name as string}</p>
            </div>
            {order.customer_address && (
              <div>
                <p className="text-sm text-gray-500">Adresse</p>
                <p className="font-medium">{order.customer_address as string}</p>
              </div>
            )}
            {order.customer_notes && (
              <div>
                <p className="text-sm text-gray-500">Notes client</p>
                <p className="text-gray-700">{order.customer_notes as string}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {phoneHref ? (
              <a
                href={phoneHref}
                className="flex-1 min-w-0 flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors min-h-[44px]"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span className="truncate">Appeler</span>
              </a>
            ) : (
              <span className="flex-1 min-w-0 flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium min-h-[44px]">
                <Phone className="w-4 h-4 shrink-0" />
                <span className="truncate">Appeler</span>
              </span>
            )}
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-0 flex items-center justify-center gap-2 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors min-h-[44px]"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </a>
            ) : (
              <span className="flex-1 min-w-0 flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-400 rounded-lg font-medium min-h-[44px]">
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span className="truncate">WhatsApp</span>
              </span>
            )}
          </div>
        </div>

        {/* Product Card */}
        <div className="bg-white rounded-xl border p-4 lg:p-6 space-y-4">
          <h2 className="text-base lg:text-lg font-semibold border-b pb-2">Produit</h2>
          {orderItem ? (
            <div className="space-y-3">
              {orderItem.product_image_snapshot && (
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative">
                  <Image
                    src={orderItem.product_image_snapshot}
                    alt={orderItem.product_title_snapshot}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <p className="font-medium">{orderItem.product_title_snapshot}</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Prix unitaire</span>
                <span>{orderItem.unit_price_at_order} {order.currency as string}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantité</span>
                <span>{orderItem.quantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Livraison</span>
                <span>{order.shipping_fee as number} {order.currency as string}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{order.total as number} {order.currency as string}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Aucun détail produit</p>
          )}
        </div>
      </div>

      {/* Admin Notes */}
      <div className="bg-white rounded-xl border p-4 lg:p-6 mt-4 lg:mt-6">
        <h2 className="text-base lg:text-lg font-semibold border-b pb-2 mb-4">Notes administrateur</h2>
        <UpdateNotesForm orderId={id} initialNotes={(order.admin_notes as string) || ''} />
      </div>

      {/* Attribution */}
      {(order.source || order.utm_source || order.ip_address) && (
        <div className="bg-white rounded-xl border p-4 lg:p-6 mt-4 lg:mt-6">
          <h2 className="text-base lg:text-lg font-semibold border-b pb-2 mb-4">Attribution</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
            {order.source && (
              <div>
                <p className="text-gray-500">Source</p>
                <p className="font-medium break-words">{order.source as string}</p>
              </div>
            )}
            {order.utm_source && (
              <div>
                <p className="text-gray-500">UTM Source</p>
                <p className="font-medium break-words">{order.utm_source as string}</p>
              </div>
            )}
            {order.utm_medium && (
              <div>
                <p className="text-gray-500">UTM Medium</p>
                <p className="font-medium break-words">{order.utm_medium as string}</p>
              </div>
            )}
            {order.utm_campaign && (
              <div>
                <p className="text-gray-500">UTM Campaign</p>
                <p className="font-medium break-words">{order.utm_campaign as string}</p>
              </div>
            )}
            {order.ip_address && (
              <div>
                <p className="text-gray-500">IP</p>
                <p className="font-medium font-mono break-all">{order.ip_address as string}</p>
              </div>
            )}
            {order.user_agent && (
              <div className="sm:col-span-2">
                <p className="text-gray-500">User Agent</p>
                <p className="font-medium text-xs break-all">{order.user_agent as string}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
