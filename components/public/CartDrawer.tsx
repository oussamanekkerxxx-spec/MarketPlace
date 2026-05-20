'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { useCart } from '@/lib/cart/context';
import { createOrderFromCart } from '@/lib/actions/orders';
import { Minus, Plus, X, ShoppingBag, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cities: Array<{ id: string; name_fr: string }>;
}

export function CartDrawer({ isOpen, onClose, cities }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, cartTotal, cartSubtotal, cartDiscount, clearCart } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCityId, setCustomerCityId] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerCityId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrderFromCart({
        items: items.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
        })),
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_city_id: customerCityId,
        customer_address: customerAddress || undefined,
        customer_notes: customerNotes || undefined,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Commande envoyée avec succès !');
      clearCart();
      setShowCheckout(false);
      onClose();
    } catch {
      toast.error('Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-warm">
          <h2 className="text-lg font-bold text-secondary">Votre panier</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <X className="h-5 w-5 text-text-muted" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted px-6">
            <ShoppingBag className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg font-medium">Votre panier est vide</p>
            <p className="text-sm mt-1">Ajoutez des produits pour commencer</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Continuer les achats
            </button>
          </div>
        ) : (
          <>
            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((item) => {
                const threshold = item.bulkDiscountThreshold;
                const percent = item.bulkDiscountPercent;
                const hasDiscount = threshold && percent && item.quantity >= threshold;
                const discountedPrice = hasDiscount
                  ? item.price * (1 - percent / 100)
                  : item.price;

                return (
                  <div
                    key={item.productId}
                    className="flex gap-3 p-3 rounded-xl bg-surface-2 border border-border-warm"
                  >
                    <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl font-bold text-text-muted">
                          {item.title.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.slug}` as '/product/[slug]'}
                        className="text-sm font-semibold text-secondary line-clamp-2 hover:text-primary transition-colors"
                        onClick={onClose}
                      >
                        {item.title}
                      </Link>

                      <div className="mt-1 flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-primary">
                          {discountedPrice.toFixed(2)} {item.currency}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-text-muted line-through">
                            {item.price} {item.currency}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-warm bg-surface hover:bg-surface-2 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-border-warm bg-surface hover:bg-surface-2 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer / Checkout */}
            <div className="border-t border-border-warm px-5 py-4 bg-surface">
              {!showCheckout ? (
                <>
                  <div className="space-y-1.5 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Sous-total</span>
                      <span className="font-medium">{cartSubtotal.toFixed(2)} MAD</span>
                    </div>
                    {cartDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Remise</span>
                        <span className="font-medium text-green-600">-{cartDiscount.toFixed(2)} MAD</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">Livraison</span>
                      <span className="font-medium text-green-600">Gratuite</span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-border-warm">
                      <span>Total</span>
                      <span className="text-primary">{cartTotal.toFixed(2)} MAD</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCheckout(true)}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm bg-primary hover:opacity-90 transition-opacity"
                  >
                    Commander
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <h3 className="font-semibold text-secondary">Informations de livraison</h3>
                  <input
                    type="text"
                    placeholder="Nom complet *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                  <select
                    value={customerCityId}
                    onChange={(e) => setCustomerCityId(e.target.value)}
                    className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Sélectionnez votre ville *</option>
                    {cities.map((city) => (
                      <option key={city.id} value={city.id}>
                        {city.name_fr}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Adresse (optionnel)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                  <textarea
                    placeholder="Notes (optionnel)"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 resize-none"
                  />

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCheckout(false)}
                      className="flex-1 py-3 rounded-xl text-sm font-semibold border border-border-warm hover:bg-surface-2 transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 py-3 rounded-xl text-sm font-bold text-white bg-primary hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isSubmitting ? 'Envoi...' : 'Confirmer'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
