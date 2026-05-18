'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch, Controller, type FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { productSchema, type ProductFormData, type DetailSectionFormData } from '@/lib/validation/product';
import { createProduct, updateProduct } from '@/lib/actions/products';
import { FormInput } from '@/components/ui/FormInput';
import { FormTextarea } from '@/components/ui/FormTextarea';
import { TrilingualField } from '@/components/admin/TrilingualField';
import { TiptapEditor } from '@/components/admin/TiptapEditor';
import { ImageUploader, type ProductImageInput } from '@/components/admin/ImageUploader';
import { NarrativeSectionsEditor } from '@/components/admin/NarrativeSectionsEditor';
import { FeaturesEditor } from '@/components/admin/FeaturesEditor';
import { AdminAccordion } from '@/components/admin/AdminAccordion';
import { StickySaveBar } from '@/components/admin/StickySaveBar';
import { Link } from '@/lib/i18n/navigation';
import {
  Tag,
  DollarSign,
  Boxes,
  Type,
  FileText,
  ListChecks,
  Image as ImageIcon,
  Images as ImagesIcon,
  Search,
  Eye,
} from 'lucide-react';

interface ProductFormProps {
  categories: Array<{ id: string; name_fr: string }>;
  initialData?: Record<string, unknown>;
  productId?: string;
}

export function ProductForm({ categories, initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEditing = !!productId;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title_fr: (initialData?.title_fr as string) || '',
      title_en: (initialData?.title_en as string) || '',
      title_ar: (initialData?.title_ar as string) || '',
      slug: (initialData?.slug as string) || '',
      short_description_fr: (initialData?.short_description_fr as string) || '',
      short_description_en: (initialData?.short_description_en as string) || '',
      short_description_ar: (initialData?.short_description_ar as string) || '',
      description_fr: (initialData?.description_fr as string) || '',
      description_en: (initialData?.description_en as string) || '',
      description_ar: (initialData?.description_ar as string) || '',
      price: (initialData?.price as number) || 0,
      compare_at_price: (initialData?.compare_at_price as number) || undefined,
      currency: (initialData?.currency as string) || 'MAD',
      category_id: (initialData?.category_id as string) || '',
      sku: (initialData?.sku as string) || '',
      stock_quantity: (initialData?.stock_quantity as number) || 0,
      track_inventory: (initialData?.track_inventory as boolean) ?? true,
      low_stock_threshold: (initialData?.low_stock_threshold as number) || 5,
      is_active: (initialData?.is_active as boolean) ?? true,
      is_featured: (initialData?.is_featured as boolean) || false,
      meta_title_fr: (initialData?.meta_title_fr as string) || '',
      meta_title_en: (initialData?.meta_title_en as string) || '',
      meta_title_ar: (initialData?.meta_title_ar as string) || '',
      meta_description_fr: (initialData?.meta_description_fr as string) || '',
      meta_description_en: (initialData?.meta_description_en as string) || '',
      meta_description_ar: (initialData?.meta_description_ar as string) || '',
      images: (initialData?.images as ProductImageInput[]) || [],
      detail_sections: (initialData?.detail_sections as DetailSectionFormData[]) || [],
      attributes:
        (initialData?.attributes as {
          features_fr?: string[];
          features_en?: string[];
          features_ar?: string[];
        }) || {},
    },
  });

  const titleFr = useWatch({ control, name: 'title_fr' }) || '';

  const sectionHasError = (...fields: (keyof ProductFormData)[]): boolean =>
    fields.some((field) => Boolean(errors[field]));

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const onValidationErrors = (formErrors: FieldErrors<ProductFormData>) => {
    const fieldList = Object.keys(formErrors).join(', ');

    toast.error(`Champs invalides : ${fieldList}`, { duration: 5000 });

    requestAnimationFrame(() => {
      const firstErrored = document.querySelector('[aria-invalid="true"]');
      if (firstErrored) {
        firstErrored.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true);
    const result = isEditing ? await updateProduct(productId!, data) : await createProduct(data);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (!isEditing) {
      toast.success('Produit créé');
      setTimeout(() => {
        window.location.href = '/fr/admin/products';
      }, 800);
      return;
    }

    toast.success('Produit mis à jour');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onValidationErrors)} className="max-w-5xl space-y-3 lg:space-y-6">
      <AdminAccordion
        title="Informations de base"
        description="Titre, slug, SKU, catégorie"
        icon={<Tag className="h-4 w-4" />}
        defaultOpen
        hasError={sectionHasError('title_fr', 'title_en', 'title_ar', 'slug', 'sku', 'category_id')}
      >
        <TrilingualField
          label="Titre"
          fr={
            <FormInput
              label=""
              {...register('title_fr')}
              error={errors.title_fr?.message}
              placeholder="Titre en français"
            />
          }
          en={
            <FormInput
              label=""
              {...register('title_en')}
              error={errors.title_en?.message}
              placeholder="Title in English"
            />
          }
          ar={<FormInput label="" {...register('title_ar')} error={errors.title_ar?.message} />}
        />

        <FormInput
          label="Slug"
          {...register('slug')}
          error={errors.slug?.message}
          helperText={titleFr ? `Suggestion: ${generateSlug(titleFr)}` : ''}
        />

        <input
          {...register('sku')}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="SKU"
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Catégorie</label>
          <select {...register('category_id')} className="w-full rounded-lg border px-3 py-2">
            <option value="">Aucune</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_fr}
              </option>
            ))}
          </select>
        </div>
      </AdminAccordion>

      <AdminAccordion
        title="Prix"
        description="Prix, prix barré, devise"
        icon={<DollarSign className="h-4 w-4" />}
        hasError={sectionHasError('price', 'compare_at_price', 'currency')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormInput
            label="Prix"
            type="number"
            step="0.01"
            {...register('price', { valueAsNumber: true })}
            error={errors.price?.message}
          />
          <FormInput
            label="Prix barré"
            type="number"
            step="0.01"
            {...register('compare_at_price', { valueAsNumber: true })}
          />
          <FormInput label="Devise" {...register('currency')} />
        </div>
      </AdminAccordion>

      <AdminAccordion
        title="Inventaire"
        description="Stock, seuil d'alerte"
        icon={<Boxes className="h-4 w-4" />}
        hasError={sectionHasError('stock_quantity', 'low_stock_threshold', 'track_inventory')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormInput
            label="Quantité en stock"
            type="number"
            {...register('stock_quantity', { valueAsNumber: true })}
          />
          <FormInput
            label="Seuil stock faible"
            type="number"
            {...register('low_stock_threshold', { valueAsNumber: true })}
          />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" {...register('track_inventory')} className="h-4 w-4" />
          <span className="text-sm">Suivre l&apos;inventaire</span>
        </label>
      </AdminAccordion>

      <AdminAccordion
        title="Descriptions courtes"
        description="Résumés affichés en haut de la fiche produit"
        icon={<Type className="h-4 w-4" />}
        hasError={sectionHasError('short_description_fr', 'short_description_en', 'short_description_ar')}
      >
        <TrilingualField
          fr={<FormTextarea label="" {...register('short_description_fr')} />}
          en={<FormTextarea label="" {...register('short_description_en')} />}
          ar={<FormTextarea label="" {...register('short_description_ar')} />}
        />
      </AdminAccordion>

      <AdminAccordion
        title="Descriptions longues"
        description="Description riche affichée sous le formulaire"
        icon={<FileText className="h-4 w-4" />}
        hasError={sectionHasError('description_fr', 'description_en', 'description_ar')}
      >
        <TrilingualField
          label=""
          fr={
            <Controller
              name="description_fr"
              control={control}
              render={({ field }) => (
                <TiptapEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Description en français..."
                  error={errors.description_fr?.message}
                />
              )}
            />
          }
          en={
            <Controller
              name="description_en"
              control={control}
              render={({ field }) => (
                <TiptapEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Description en anglais..."
                  error={errors.description_en?.message}
                />
              )}
            />
          }
          ar={
            <Controller
              name="description_ar"
              control={control}
              render={({ field }) => (
                <TiptapEditor
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Description en arabe..."
                  error={errors.description_ar?.message}
                />
              )}
            />
          }
        />
      </AdminAccordion>

      <AdminAccordion
        title="Caractéristiques"
        description="Liste à puces affichée sur la fiche produit"
        icon={<ListChecks className="h-4 w-4" />}
        hasError={sectionHasError('attributes')}
      >
        <Controller
          name="attributes"
          control={control}
          render={({ field }) => <FeaturesEditor value={field.value || {}} onChange={field.onChange} />}
        />
      </AdminAccordion>

      <AdminAccordion
        title="Images"
        description="Galerie principale du produit"
        icon={<ImageIcon className="h-4 w-4" />}
        hasError={sectionHasError('images')}
      >
        <Controller
          name="images"
          control={control}
          render={({ field }) => <ImageUploader value={field.value || []} onChange={field.onChange} />}
        />
        {errors.images && <p className="text-xs text-red-600">{errors.images.message}</p>}
      </AdminAccordion>

      <AdminAccordion
        title="Sections narratives"
        description="Visuels detailes pour une presentation type landing page"
        icon={<ImagesIcon className="h-4 w-4" />}
        hasError={sectionHasError('detail_sections')}
      >
        <Controller
          name="detail_sections"
          control={control}
          render={({ field }) => (
            <NarrativeSectionsEditor value={field.value || []} onChange={field.onChange} />
          )}
        />
      </AdminAccordion>

      <AdminAccordion
        title="SEO"
        description="Meta titre et description pour les moteurs de recherche"
        icon={<Search className="h-4 w-4" />}
        hasError={sectionHasError(
          'meta_title_fr',
          'meta_title_en',
          'meta_title_ar',
          'meta_description_fr',
          'meta_description_en',
          'meta_description_ar'
        )}
      >
        <TrilingualField
          label="Meta titre"
          fr={<FormInput label="" {...register('meta_title_fr')} />}
          en={<FormInput label="" {...register('meta_title_en')} />}
          ar={<FormInput label="" {...register('meta_title_ar')} />}
        />
        <TrilingualField
          label="Meta description"
          fr={<FormTextarea label="" {...register('meta_description_fr')} />}
          en={<FormTextarea label="" {...register('meta_description_en')} />}
          ar={<FormTextarea label="" {...register('meta_description_ar')} />}
        />
      </AdminAccordion>

      <AdminAccordion
        title="Visibilité"
        description="Activer le produit ou le mettre en vedette"
        icon={<Eye className="h-4 w-4" />}
        hasError={sectionHasError('is_active', 'is_featured')}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('is_active')} className="h-4 w-4" />
            <span className="text-sm">Actif</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register('is_featured')} className="h-4 w-4" />
            <span className="text-sm">En vedette</span>
          </label>
        </div>
      </AdminAccordion>

      <div className="hidden items-center gap-4 pb-4 lg:flex">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-orange-600 px-6 py-2.5 font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer le produit'}
        </button>
        <Link
          href="/admin/products"
          className="rounded-lg border px-6 py-2.5 font-medium transition-colors hover:bg-gray-50"
        >
          Annuler
        </Link>
      </div>

      <StickySaveBar
        visible={isDirty}
        saving={saving}
        saveLabel={isEditing ? 'Mettre à jour' : 'Créer'}
        onSave={() => handleSubmit(onSubmit, onValidationErrors)()}
      />

      <div className="h-20 lg:hidden" aria-hidden="true" />
    </form>
  );
}
