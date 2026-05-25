'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { heroImageSchema, type HeroImageFormData } from '@/lib/validation/heroImage';
import { createHeroImage, updateHeroImage } from '@/lib/actions/heroImages';
import { SimpleImageUploader } from '@/components/admin/SimpleImageUploader';
import { FormInput } from '@/components/ui/FormInput';

interface HeroImageFormProps {
  initialData?: Partial<HeroImageFormData>;
  itemId?: string;
  existingCount?: number;
}

export function HeroImageForm({ initialData, itemId, existingCount = 0 }: HeroImageFormProps) {
  const isEditing = !!itemId;
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<HeroImageFormData>({
    resolver: zodResolver(heroImageSchema),
    defaultValues: {
      url: initialData?.url || '',
      alt_text: initialData?.alt_text || '',
      is_active: initialData?.is_active ?? true,
      display_order: initialData?.display_order ?? 0,
    },
  });

  const imageUrl = watch('url');

  const onSubmit = async (data: HeroImageFormData) => {
    if (!isEditing && existingCount >= 4) {
      setStatus('error');
      setMessage('Maximum 4 images autorisées. Supprimez une image avant d\'en ajouter une nouvelle.');
      return;
    }

    setStatus('loading');
    if (isEditing) {
      const result = await updateHeroImage(itemId!, data);
      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setMessage('Image mise à jour avec succès');
        setTimeout(() => setStatus('idle'), 2000);
      }
    } else {
      const result = await createHeroImage(data);
      if (result.error) {
        setStatus('error');
        setMessage(result.error);
      } else {
        setStatus('success');
        setMessage('Image ajoutée avec succès');
        reset();
        setTimeout(() => setStatus('idle'), 2000);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {status === 'success' && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
      {status === 'error' && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{message}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
        <SimpleImageUploader
          bucket="site-assets"
          value={imageUrl}
          onChange={(url) => setValue('url', url, { shouldValidate: true })}
          previewClassName="w-full h-40"
        />
        {errors.url && <p className="text-sm text-red-600 mt-1">{errors.url.message}</p>}
      </div>

      <FormInput
        label="Texte alternatif (SEO)"
        placeholder="Description de l'image"
        {...register('alt_text')}
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
