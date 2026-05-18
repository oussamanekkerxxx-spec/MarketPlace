'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { citySchema, type CityFormData } from '@/lib/validation/city';
import { createCity } from '@/lib/actions/cities';
import { FormInput } from '@/components/ui/FormInput';

export function CitiesForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      shipping_fee: 30,
      estimated_days: 2,
      is_active: true,
      display_order: 0,
    },
  });

  const onSubmit = async (data: CityFormData) => {
    setStatus('loading');
    const result = await createCity(data);
    if (result.error) {
      setStatus('error');
      setMessage(result.error);
    } else {
      setStatus('success');
      setMessage('Ville ajoutée avec succès');
      reset();
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {status === 'success' && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
      {status === 'error' && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{message}</div>}

      <FormInput label="Nom (FR)" {...register('name_fr')} error={errors.name_fr?.message} />
      <FormInput label="Nom (EN)" {...register('name_en')} error={errors.name_en?.message} />
      <FormInput label="Nom (AR)" {...register('name_ar')} error={errors.name_ar?.message} />
      
      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Frais de livraison"
          type="number"
          step="0.01"
          {...register('shipping_fee', { valueAsNumber: true })}
          error={errors.shipping_fee?.message}
        />
        <FormInput
          label="Jours estimés"
          type="number"
          {...register('estimated_days', { valueAsNumber: true })}
          error={errors.estimated_days?.message}
        />
      </div>

      <FormInput
        label="Ordre d'affichage"
        type="number"
        {...register('display_order', { valueAsNumber: true })}
      />

      <label className="flex items-center gap-2">
        <input type="checkbox" {...register('is_active')} className="w-4 h-4" />
        <span className="text-sm">Active</span>
      </label>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 transition-colors"
      >
        {status === 'loading' ? 'Ajout...' : 'Ajouter'}
      </button>
    </form>
  );
}
