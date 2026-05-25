'use client';

import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Minus, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Turnstile } from 'react-turnstile';
import { useTranslations } from 'next-intl';
import { createReservation } from '@/lib/actions/orders';
import { reservationSchema, type ReservationInput } from '@/lib/validation/reservation';
import { gtagEvent } from '@/components/public/GoogleTracking';

interface ReservationFormProps {
  productId: string;
  productPrice: number;
  productCurrency: string;
  trustLine?: string;
  bulkDiscountThreshold?: number;
  bulkDiscountPercent?: number;
}

export function ReservationForm({
  productId,
  productPrice,
  productCurrency,
  trustLine,
  bulkDiscountThreshold,
  bulkDiscountPercent,
}: ReservationFormProps) {
  const router = useRouter();
  const t = useTranslations('reservation');
  const [serverError, setServerError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [turnstileError, setTurnstileError] = useState(false);
  const [turnstileFailed, setTurnstileFailed] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ReservationInput>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      customer_city_name: '',
      customer_address: '',
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

  const turnstileSiteKey =
    process.env.NODE_ENV === 'development'
      ? null
      : (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '');

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

  const shippingFee = 0; // Free shipping

  const hasBulkDiscount =
    bulkDiscountThreshold && bulkDiscountPercent && quantity >= bulkDiscountThreshold;
  const discountRate = hasBulkDiscount ? bulkDiscountPercent / 100 : 0;
  const discountedUnitPrice = hasBulkDiscount
    ? productPrice * (1 - discountRate)
    : productPrice;
  const subtotal = discountedUnitPrice * quantity;
  const discountAmount = hasBulkDiscount ? productPrice * quantity - subtotal : 0;
  const total = subtotal + shippingFee;

  const onSubmit = async (data: ReservationInput) => {
    setServerError('');

    const result = await createReservation({
      product_id: productId,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_city_name: data.customer_city_name,
      customer_address: data.customer_address,
      quantity,
      discount_percent: hasBulkDiscount ? bulkDiscountPercent : undefined,
      discount_amount: hasBulkDiscount ? Number(discountAmount.toFixed(2)) : undefined,
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
          {t('fullName')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('customer_name')}
          className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder={t('fullNamePlaceholder')}
        />
        {errors.customer_name && (
          <p className="mt-1 text-xs text-red-600">{t('validation.nameTooShort')}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">
          {t('phone')} <span className="text-red-500">*</span>
        </label>
        <div className="flex" dir="ltr">
          <span className="inline-flex items-center rounded-l-lg border border-r-0 bg-surface-2 px-3 py-2.5 text-sm text-text-muted">
            +212
          </span>
          <input
            type="tel"
            {...register('customer_phone')}
            className="flex-1 rounded-r-lg border border-border-warm bg-surface px-3 py-2.5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
            placeholder={t('phonePlaceholder')}
          />
        </div>
        {errors.customer_phone && (
          <p className="mt-1 text-xs text-red-600">{t('validation.phoneInvalid')}</p>
        )}
        <p className="mt-1 text-xs text-text-muted">{t('phoneFormat')}</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">
          {t('city')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('customer_city_name')}
          className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder={t('cityPlaceholder')}
        />
        {errors.customer_city_name && (
          <p className="mt-1 text-xs text-red-600">{t('validation.cityRequired')}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">{t('address')}</label>
        <input
          type="text"
          {...register('customer_address')}
          className="w-full rounded-lg border border-border-warm bg-surface px-3 py-2.5 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
          placeholder={t('addressPlaceholder')}
        />
      </div>

      <div className="space-y-3 rounded-xl border border-border-warm bg-surface-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-secondary">{t('quantity')}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              disabled={quantity <= 1}
              aria-label={t('decreaseQuantity')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-warm bg-surface transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-semibold tabular-nums text-secondary">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((current) => Math.min(99, current + 1))}
              aria-label={t('increaseQuantity')}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border-warm bg-surface transition-colors hover:bg-surface-2"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 border-t border-border-warm pt-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">
              {t('product')} {quantity > 1 && <span className="text-text-muted">× {quantity}</span>}
            </span>
            <span className="font-medium text-secondary">
              {hasBulkDiscount ? (
                <span>
                  <span className="text-text-muted line-through text-xs mr-1">
                    {productPrice * quantity} {productCurrency}
                  </span>
                  {subtotal.toFixed(2)} {productCurrency}
                </span>
              ) : (
                <span>{subtotal} {productCurrency}</span>
              )}
            </span>
          </div>
          {hasBulkDiscount && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">{t('discountLabel', { percent: bulkDiscountPercent })}</span>
              <span className="font-medium text-green-600">
                -{discountAmount.toFixed(2)} {productCurrency}
              </span>
            </div>
          )}
          <div className="flex justify-between border-t border-border-warm pt-2 text-lg font-bold">
            <span className="text-secondary">{t('total')}</span>
            <span className="text-primary">
              {total.toFixed(2)} {productCurrency}
            </span>
          </div>
        </div>
      </div>

      {turnstileSiteKey && (
        <div className="flex flex-col items-center gap-2">
          {!turnstileFailed && (
            <Turnstile
              sitekey={turnstileSiteKey}
              onVerify={(token) => {
                setValue('turnstileToken', token);
                setTurnstileError(false);
              }}
              onError={() => {
                setTurnstileError(true);
                setTurnstileFailed(true);
                setValue('turnstileToken', '__no_turnstile__');
              }}
              onExpire={() => setValue('turnstileToken', '')}
              theme="light"
              size="normal"
            />
          )}
          {/* Hidden input so react-hook-form tracks the token state */}
          <input type="hidden" {...register('turnstileToken')} />
          {turnstileError && (
            <p className="text-center text-xs text-amber-600">
              La vérification de sécurité est temporairement indisponible. Votre commande sera protégée par d&apos;autres mécanismes.
            </p>
          )}
        </div>
      )}
      {errors.turnstileToken && (
        <p className="text-center text-xs text-red-600">{errors.turnstileToken.message}</p>
      )}

      <div className="relative overflow-hidden" aria-hidden="true">
        <div className="absolute left-[-9999px]">
          <input
            type="text"
            {...register('website')}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg py-3.5 text-lg font-bold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {isSubmitting ? t('processing') : t('submit')}
      </button>

      {trustLine && (
        <p className="flex items-center justify-center gap-1.5 text-center text-sm text-success">
          <ShieldCheck className="h-4 w-4" />
          {trustLine}
        </p>
      )}

      <p className="text-center text-xs text-text-muted">
        {t('confirmationText')}
      </p>
    </form>
  );
}
