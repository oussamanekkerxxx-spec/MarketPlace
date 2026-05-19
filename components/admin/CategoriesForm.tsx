'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categorySchema, type CategoryFormData } from '@/lib/validation/category';
import { createCategory } from '@/lib/actions/categories';
import { FormInput } from '@/components/ui/FormInput';
import { TrilingualField } from '@/components/admin/TrilingualField';
import { SimpleImageUploader } from '@/components/admin/SimpleImageUploader';

interface CategoryOption {
  id: string;
  name_fr: string;
  parent_id: string | null;
}

interface CategoriesFormProps {
  categories: CategoryOption[];
}

type CategoryWithDepth = {
  id: string;
  name_fr: string;
  depth: number;
};

function flattenCategoryTree(categories: CategoryOption[]): CategoryWithDepth[] {
  const map = new Map<
    string,
    { id: string; name_fr: string; parent_id: string | null; children: string[] }
  >();

  categories.forEach((cat) => {
    map.set(cat.id, { ...cat, children: [] });
  });

  const rootIds: string[] = [];
  categories.forEach((cat) => {
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(cat.id);
    } else {
      rootIds.push(cat.id);
    }
  });

  const result: CategoryWithDepth[] = [];
  function traverse(id: string, depth: number) {
    const node = map.get(id);
    if (!node) return;
    result.push({ id: node.id, name_fr: node.name_fr, depth });
    node.children.forEach((childId) => traverse(childId, depth + 1));
  }

  rootIds.forEach((id) => traverse(id, 0));
  return result;
}

export function CategoriesForm({ categories }: CategoriesFormProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      is_active: true,
      display_order: 0,
    },
  });

  const nameFr = watch('name_fr');

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const onSubmit = async (data: CategoryFormData) => {
    setStatus('loading');
    const result = await createCategory(data);
    if (result.error) {
      setStatus('error');
      setMessage(result.error);
    } else {
      setStatus('success');
      setMessage('Catégorie ajoutée avec succès');
      reset();
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const categoryTree = flattenCategoryTree(categories);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {status === 'success' && <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">{message}</div>}
      {status === 'error' && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{message}</div>}

      <TrilingualField
        label="Nom"
        fr={
          <FormInput
            label=""
            {...register('name_fr')}
            error={errors.name_fr?.message}
            onBlur={(e) => {
              const currentSlug = watch('slug');
              if (!currentSlug && e.target.value) {
                setValue('slug', generateSlug(e.target.value));
              }
            }}
          />
        }
        en={<FormInput label="" {...register('name_en')} error={errors.name_en?.message} />}
        ar={<FormInput label="" {...register('name_ar')} error={errors.name_ar?.message} />}
      />

      <FormInput
        label="Slug"
        {...register('slug')}
        error={errors.slug?.message}
        helperText={nameFr ? `Suggestion: ${generateSlug(nameFr)}` : ''}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie parente</label>
        <select
          {...register('parent_id')}
          className="w-full px-3 py-2 border rounded-lg bg-white"
        >
          <option value="">Aucune (catégorie principale)</option>
          {categoryTree.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {'\u00A0\u00A0'.repeat(cat.depth)}
              {cat.depth > 0 ? '↳ ' : ''}
              {cat.name_fr}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Sélectionnez une catégorie parente pour créer une sous-catégorie.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Image de la catégorie</label>
        <SimpleImageUploader
          bucket="category-images"
          value={watch('image_url') || ''}
          onChange={(url) => setValue('image_url', url)}
        />
      </div>

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
