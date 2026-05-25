'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productRowSchema, type ProductRowFormData } from '@/lib/validation/productRow';
import { createProductRow, updateProductRow } from '@/lib/actions/productRows';
import { FormInput } from '@/components/ui/FormInput';
import { TrilingualField } from '@/components/admin/TrilingualField';

interface ProductRowFormProps {
  initialData?: Partial<ProductRowFormData>;
  rowId?: string;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ProductRowForm({ initialData, rowId }: ProductRowFormProps) {
  const isEditing = !!rowId;
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductRowFormData>({
    resolver: zodResolver(productRowSchema),
    defaultValues: {
      slug: initialData?.slug || '',
      title_fr: initialData?.title_fr || '',
      title_en: initialData?.title_en || '',
      title_ar: initialData?.title_ar || '',
      subtitle_fr: initialData?.subtitle_fr || '',
      subtitle_en: initialData?.subtitle_en || '',
      subtitle_ar: initialData?.subtitle_ar || '',
      display_order: initialData?.display_order ?? 0,
      is_active: initialData?.is_active ?? true,
    },
  });

  const titleFr = watch('title_fr') || '';
  const currentSlug = watch('slug') || '';
  const autoSlugRef = useRef('');

  useEffect(() => {
    if (isEditing || !titleFr) return;
    const generated = generateSlug(titleFr);
    if (!currentSlug || currentSlug === autoSlugRef.current) {
      setValue('slug', generated, { shouldDirty: currentSlug !== '' });
      autoSlugRef.current = generated;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleFr, isEditing]);

  const onSubmit = async (data: ProductRowFormData) => {
    setStatus('loading');
    if (isEditing) {
      const result = await updateProductRow(rowId!, data);
      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setMessage('Section mise à jour avec succès');
        setTimeout(() => setStatus('idle'), 2000);
      }
    } else {
      const result = await createProductRow(data);
      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setMessage('Section ajoutée avec succès');
        reset();
        setTimeout(() => setStatus('idle'), 2000);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {status === 'success' && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
      {status === 'error' && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{message}</div>}

      <FormInput
        label="Slug"
        {...register('slug')}
        error={errors.slug?.message}
        helperText={!isEditing && titleFr ? `Suggestion: ${generateSlug(titleFr)}` : ''}
      />

      <TrilingualField
        label="Titre"
        fr={<input {...register('title_fr')} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: Nouveautés" />}
        en={<input {...register('title_en')} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. New Arrivals" />}
        ar={<input {...register('title_ar')} className="w-full px-3 py-2 border rounded-lg" placeholder="مثال: وصل حديثاً" />}
      />
      {errors.title_fr && <p className="text-sm text-red-600">{errors.title_fr.message}</p>}

      <TrilingualField
        label="Sous-titre"
        fr={<input {...register('subtitle_fr')} className="w-full px-3 py-2 border rounded-lg" placeholder="Ex: Découvrez nos derniers arrivages" />}
        en={<input {...register('subtitle_en')} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Discover our latest arrivals" />}
        ar={<input {...register('subtitle_ar')} className="w-full px-3 py-2 border rounded-lg" placeholder="مثال: اكتشف أحدث وصولاتنا" />}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormInput
          label="Ordre d'affichage"
          type="number"
          {...register('display_order', {
            setValueAs: (value) => (value === '' || value == null ? undefined : Number(value)),
          })}
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
        {status === 'loading'
          ? isEditing
            ? 'Mise à jour...'
            : 'Ajout...'
          : isEditing
            ? 'Mettre à jour'
            : 'Ajouter'}
      </button>
    </form>
  );
}
