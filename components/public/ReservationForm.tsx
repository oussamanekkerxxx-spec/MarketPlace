'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Turnstile } from 'react-turnstile';
import { createReservation } from '@/lib/actions/orders';
import { reservationSchema, type ReservationInput } from '@/lib/validation/reservation';
import { gtagEvent, gtagConversion } from '@/components/public/GoogleTracking';

interface City {
  id: string;
  name_fr: string;
  shipping_fee: number;
}

interface ReservationFormProps {
  productId: string;
  productPrice: number;
  productCurrency: string;
  cities: City[];
  trustLine?: string;
}

export function ReservationForm({
  productId,
  productPrice,
  productCurrency,
  cities,
  trustLine,
}: ReservationFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [quantity, setQuantity] = useState(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      customer_city_id: '',
      customer_address: '',
      customer_notes: '',
      turnstileToken: '',
      website: '',
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
      utm_term: '',
      utm_content: '',
      referrer: '',
    },
  });

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

  useEffect(() => {
    if (!turnstileSiteKey) {
      setValue('turnstileToken', '__no_turnstile__');
    }
  }, [turnstileSiteKey, setValue]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'] as const;

    utmFields.forEach((field) => {
      const value = params.get(field);
      if (value) {
        setValue(field, value);
      }
    });

    const referrer = document.referrer;
    if (referrer && referrer !== window.location.href) {
      setValue('referrer', referrer);
    }
  }, [setValue]);

  const selectedCityId = watch('customer_city_id');
  const selectedCity = cities.find((city) => city.id === selectedCityId);
  const shippingFee = selectedCity?.shipping_fee || 0;
  const subtotal = productPrice * quantity;
  const total = subtotal + shippingFee;

  const onSubmit = async (data: ReservationInput) => {
    setServerError('');

    const result = await createReservation({
      product_id: productId,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_city_id: data.customer_city_id,
      customer_address: data.customer_address,
      customer_notes: data.customer_notes,
      quantity,
      turnstile_token: data.turnstileToken,
      website: data.website,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_term: data.utm_term,
      utm_content: data.utm_content,
      referrer: data.referrer,
    });

    if (result.error) {
      setServerError(result.error);
      return;
    }

    const eventValue = result.total ?? total;
    const eventCurrency = result.currency ?? productCurrency;

    // Meta Pixel Lead event
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).fbq) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).fbq(
        'track',
        'Lead',
        {
          content_name: 'Product Reservation',
          value: eventValue,
          currency: eventCurrency,
        },
        { eventID: `lead-${result.orderNumber}` }
      );
    }

    // Google Analytics / Ads — lead/submit event
    gtagEvent('generate_lead', {
      currency: eventCurrency,
      value: eventValue,
    });

    router.push(`/reservation/success?order=${result.orderNumber}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">
          Nom complet <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('customer_name')}
          className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder="Votre nom complet"
        />
        {errors.customer_name && (
          <p className="mt-1 text-xs text-red-600">{errors.customer_name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">
          Téléphone <span className="text-red-500">*</span>
        </label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 bg-surface-2 px-3 py-2.5 text-sm text-text-muted">
            +212
          </span>
          <input
            type="tel"
            {...register('customer_phone')}
            className="flex-1 rounded-r-lg border border-border-warm bg-surface px-3 py-2.5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder="6 12 34 56 78"
          />
        </div>
        {errors.customer_phone && (
          <p className="mt-1 text-xs text-red-600">{errors.customer_phone.message}</p>
        )}
        <p className="mt-1 text-xs text-text-muted">Format: 06 12 34 56 78</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">
          Ville <span className="text-red-500">*</span>
        </label>
        <select
          {...register('customer_city_id')}
          className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Sélectionnez votre ville</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name_fr} (+{city.shipping_fee} MAD)
            </option>
          ))}
        </select>
        {errors.customer_city_id && (
          <p className="mt-1 text-xs text-red-600">{errors.customer_city_id.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">Adresse (optionnel)</label>
        <input
          type="text"
          {...register('customer_address')}
          className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder="Votre adresse"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">Notes (optionnel)</label>
        <textarea
          {...register('customer_notes')}
          className="min-h-[80px] w-full resize-y rounded-lg border border-border-warm bg-surface px-3 py-2.5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder="Instructions spéciales..."
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border-warm bg-surface-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-secondary">Quantité</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              disabled={quantity <= 1}
              aria-label="Diminuer la quantité"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-warm bg-surface transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-semibold tabular-nums text-secondary">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.min(99, current + 1))}
              aria-label="Augmenter la quantité"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-warm bg-surface transition-colors hover:bg-surface-2"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 border-t border-border-warm pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">
              Produit {quantity > 1 && <span className="text-text-muted">× {quantity}</span>}
            </span>
            <span className="font-medium text-secondary">
              {subtotal} {productCurrency}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Livraison</span>
            <span className="font-medium text-secondary">
              {shippingFee} {productCurrency}
            </span>
          </div>
          <div className="flex justify-between border-t border-border-warm pt-2 text-lg font-bold">
            <span className="text-secondary">Total</span>
            <span className="text-primary">
              {total} {productCurrency}
            </span>
          </div>
        </div>
      </div>

      {turnstileSiteKey && (
        <div className="flex flex-col items-center gap-2">
          <Turnstile
            sitekey={turnstileSiteKey}
            onVerify={(token) => setValue('turnstileToken', token)}
            onError={() => {
              setValue('turnstileToken', '');
              // If the widget key is invalid, allow dev/testing to proceed
              // by treating it as a no-op (the server will still validate).
            }}
            onExpire={() => setValue('turnstileToken', '')}
            theme="light"
            size="normal"
          />
          {/* Hidden input so react-hook-form tracks the token state */}
          <input type="hidden" {...register('turnstileToken')} />
        </div>
      )}
      {errors.turnstileToken && (
        <p className="text-center text-xs text-red-600">{errors.turnstileToken.message}</p>
      )}

      <div className="absolute left-[-9999px]" aria-hidden="true">
        <input
          type="text"
          {...register('website')}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg py-3.5 text-lg font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {isSubmitting ? 'Traitement...' : 'Confirmer ma commande'}
      </button>

      {trustLine && (
        <p className="flex items-center justify-center gap-1.5 text-center text-sm text-success">
          <ShieldCheck className="h-4 w-4" />
          {trustLine}
        </p>
      )}

      <p className="text-center text-xs text-text-muted">
        En confirmant, vous acceptez d&apos;être contacté par téléphone pour la validation de votre
        commande.
      </p>
    </form>
  );
}
