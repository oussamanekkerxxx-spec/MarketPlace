'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { whyUsItemSchema, type WhyUsItemFormData } from '@/lib/validation/whyUsItem';
import { createWhyUsItem } from '@/lib/actions/whyUsItems';
import { FormInput } from '@/components/ui/FormInput';
import { TrilingualField } from '@/components/admin/TrilingualField';

export function WhyUsItemForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WhyUsItemFormData>({
    resolver: zodResolver(whyUsItemSchema),
    defaultValues: {
      is_active: true,
      display_order: 0,
    },
  });

  const onSubmit = async (data: WhyUsItemFormData) => {
    setStatus('loading');
    const result = await createWhyUsItem(data);
    if (result.error) {
      setStatus('error');
      setMessage(result.error);
    } else {
      setStatus('success');
      setMessage('Élément ajouté avec succès');
      reset();
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {status === 'success' && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
      {status === 'error' && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{message}</div>}

      <TrilingualField
        label="Numéro / Label"
        fr={<input {...register('number_label_fr')} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: 01" />}
        en={<input {...register('number_label_en')} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. 01" />}
        ar={<input {...register('number_label_ar')} className="w-full px-3 py-2 border rounded-lg" placeholder="مثال: 01" />}
      />
      {errors.number_label_fr && <p className="text-sm text-red-600">{errors.number_label_fr.message}</p>}

      <TrilingualField
        label="Titre"
        fr={<input {...register('title_fr')} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: Livraison rapide" />}
        en={<input {...register('title_en')} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Fast Delivery" />}
        ar={<input {...register('title_ar')} className="w-full px-3 py-2 border rounded-lg" placeholder="مثال: توصيل سريع" />}
      />
      {errors.title_fr && <p className="text-sm text-red-600">{errors.title_fr.message}</p>}

      <TrilingualField
        label="Texte"
        fr={<textarea {...register('text_fr')} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: Livraison en 24-48h partout au Maroc..." />}
        en={<textarea {...register('text_en')} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Delivery in 24-48h all over Morocco..." />}
        ar={<textarea {...register('text_ar')} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="مثال: توصيل خلال 24-48 ساعة في جميع أنحاء المغرب..." />}
      />
      {errors.text_fr && <p className="text-sm text-red-600">{errors.text_fr.message}</p>}

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Ordre d'affichage"
          type="number"
          {...register('display_order', { valueAsNumber: true })}
        />
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" {...register('is_active')} className="w-4 h-4" />
        <span className="text-sm">Actif</span>
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
