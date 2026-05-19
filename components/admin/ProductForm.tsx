'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
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

const FIELD_LABELS: Partial<Record<keyof ProductFormData, string>> = {
  title_fr: 'Titre (FR)',
  title_en: 'Titre (EN)',
  title_ar: 'Titre (AR)',
  slug: 'Slug',
  sku: 'SKU',
  category_id: 'Catégorie',
  price: 'Prix',
  compare_at_price: 'Prix barré',
  currency: 'Devise',
  stock_quantity: 'Quantité en stock',
  low_stock_threshold: 'Seuil stock faible',
  track_inventory: 'Suivi inventaire',
  short_description_fr: 'Description courte (FR)',
  short_description_en: 'Description courte (EN)',
  short_description_ar: 'Description courte (AR)',
  description_fr: 'Description longue (FR)',
  description_en: 'Description longue (EN)',
  description_ar: 'Description longue (AR)',
  attributes: 'Caractéristiques',
  images: 'Images',
  detail_sections: 'Sections narratives',
  meta_title_fr: 'Meta titre (FR)',
  meta_title_en: 'Meta titre (EN)',
  meta_title_ar: 'Meta titre (AR)',
  meta_description_fr: 'Meta description (FR)',
  meta_description_en: 'Meta description (EN)',
  meta_description_ar: 'Meta description (AR)',
  is_active: 'Actif',
  is_featured: 'En vedette',
};

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function ProductForm({ categories, initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const isEditing = !!productId;

  const {
    register,
    handleSubmit,
    control,
    setValue,
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
      compare_at_price: initialData?.compare_at_price != null ? (initialData.compare_at_price as number) : undefined,
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
  const currentSlug = useWatch({ control, name: 'slug' }) || '';
  const autoSlugRef = useRef('');

  // Auto-fill slug from title_fr on create, unless user manually edited it
  useEffect(() => {
    if (isEditing || !titleFr) return;
    const generated = generateSlug(titleFr);
    if (!currentSlug || currentSlug === autoSlugRef.current) {
      setValue('slug', generated, { shouldDirty: currentSlug !== '' });
      autoSlugRef.current = generated;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleFr, isEditing]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const sectionHasError = (...fields: (keyof ProductFormData)[]): boolean =>
    fields.some((field) => Boolean(errors[field]));

  const onValidationErrors = (formErrors: FieldErrors<ProductFormData>) => {
    const fieldList = (Object.keys(formErrors) as (keyof ProductFormData)[])
      .map(k => FIELD_LABELS[k] ?? k)
      .join(', ');

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
    try {
      const result = isEditing ? await updateProduct(productId!, data) : await createProduct(data);

      if (result.error) {
        type ActionIssue = { path: PropertyKey[]; message: string };
        const issues = (result as { issues?: ActionIssue[] }).issues;
        if (issues && issues.length > 0) {
          const details = issues
            .map((issue) => {
              const field = issue.path[0] as keyof ProductFormData | undefined;
              const label = field ? (FIELD_LABELS[field] ?? String(field)) : '';
              return label ? `${label} — ${issue.message}` : issue.message;
            })
            .join('\n');
          toast.error(details, { duration: 7000 });
        } else {
          toast.error(result.error);
        }
        return;
      }

      if (!isEditing) {
        toast.success('Produit créé');
        router.push('/admin/products');
        return;
      }

      toast.success('Produit mis à jour');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Une erreur inattendue est survenue');
    } finally {
      setSaving(false);
    }
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
          frHasError={!!errors.title_fr}
          enHasError={!!errors.title_en}
          arHasError={!!errors.title_ar}
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
          helperText={!isEditing && titleFr ? `Suggestion: ${generateSlug(titleFr)}` : ''}
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
            {...register('price', { setValueAs: v => (v === '' || v == null ? 0 : Number(v)) })}
            error={errors.price?.message}
          />
          <FormInput
            label="Prix barré"
            type="number"
            step="0.01"
            {...register('compare_at_price', { setValueAs: v => (v === '' || v == null ? undefined : Number(v)) })}
            error={errors.compare_at_price?.message}
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
            {...register('stock_quantity', { setValueAs: v => (v === '' || v == null ? undefined : Number(v)) })}
            error={errors.stock_quantity?.message}
          />
          <FormInput
            label="Seuil stock faible"
            type="number"
            {...register('low_stock_threshold', { setValueAs: v => (v === '' || v == null ? undefined : Number(v)) })}
            error={errors.low_stock_threshold?.message}
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
          frHasError={!!errors.short_description_fr}
          enHasError={!!errors.short_description_en}
          arHasError={!!errors.short_description_ar}
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
          frHasError={!!errors.description_fr}
          enHasError={!!errors.description_en}
          arHasError={!!errors.description_ar}
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
          frHasError={!!errors.meta_title_fr}
          enHasError={!!errors.meta_title_en}
          arHasError={!!errors.meta_title_ar}
          fr={<FormInput label="" {...register('meta_title_fr')} />}
          en={<FormInput label="" {...register('meta_title_en')} />}
          ar={<FormInput label="" {...register('meta_title_ar')} />}
        />
        <TrilingualField
          label="Meta description"
          frHasError={!!errors.meta_description_fr}
          enHasError={!!errors.meta_description_en}
          arHasError={!!errors.meta_description_ar}
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
        <button
          type="button"
          onClick={() => {
            if (!isDirty || confirm('Modifications non sauvegardées. Quitter quand même ?')) {
              router.push('/admin/products');
            }
          }}
          className="rounded-lg border px-6 py-2.5 font-medium transition-colors hover:bg-gray-50"
        >
          Annuler
        </button>
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
