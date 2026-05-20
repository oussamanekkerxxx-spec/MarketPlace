'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Store, Phone, Home, Bell, MessageCircle } from 'lucide-react';

import { settingsSchema, type SettingsFormData } from '@/lib/validation/settings';
import { updateSettings } from '@/lib/actions/settings';
import { testEmailNotification } from '@/lib/actions/email-test';
import { FormInput } from '@/components/ui/FormInput';
import { FormTextarea } from '@/components/ui/FormTextarea';
import { SimpleImageUploader } from '@/components/admin/SimpleImageUploader';
import { StickySaveBar } from '@/components/admin/StickySaveBar';
import { AdminAccordion } from '@/components/admin/AdminAccordion';

const TRUST_ICONS = [
  { value: 'Truck', label: '🚚 Livraison' },
  { value: 'Banknote', label: '💵 Paiement' },
  { value: 'ShieldCheck', label: '🛡️ Sécurité' },
  { value: 'Package', label: '📦 Colis' },
  { value: 'Clock', label: '⏱️ Rapidité' },
  { value: 'RotateCcw', label: '↩️ Retour' },
  { value: 'BadgeCheck', label: '✅ Vérifié' },
  { value: 'Lock', label: '🔒 Sécurisé' },
  { value: 'Headphones', label: '🎧 Support' },
  { value: 'MapPin', label: '📍 Localisation' },
  { value: 'Star', label: '⭐ Qualité' },
  { value: 'ThumbsUp', label: '👍 Satisfaction' },
  { value: 'Zap', label: '⚡ Rapide' },
  { value: 'Heart', label: '❤️ Confiance' },
  { value: 'Award', label: '🏆 Récompense' },
];

function IconSelect({ label, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <select
        {...props}
        className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
      >
        {TRUST_ICONS.map((icon) => (
          <option key={icon.value} value={icon.value}>
            {icon.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Tabs config — short labels + lucide icons (icon-above-label layout on mobile) */
const TABS = [
  { key: 'brand', label: 'Marque', icon: Store, multilingual: true },
  { key: 'contact', label: 'Contact', icon: Phone, multilingual: false },
  { key: 'homepage', label: 'Accueil', icon: Home, multilingual: true },
  { key: 'integrations', label: 'Intégrations', icon: Bell, multilingual: false },
  { key: 'messages', label: 'Messages', icon: MessageCircle, multilingual: true },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface SettingsSecretStatus {
  hasMetaCapiAccessToken: boolean;
}

interface SettingsFormProps {
  initialData: Record<string, unknown> | null;
  secretStatus: SettingsSecretStatus;
}

export function SettingsForm({ initialData, secretStatus }: SettingsFormProps) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('brand');
  const [emailTesting, setEmailTesting] = useState(false);
  const [langTab, setLangTab] = useState<'fr' | 'en' | 'ar'>('fr');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty, dirtyFields },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      site_name: (initialData?.site_name as string) || 'My Shop',
      site_tagline_fr: (initialData?.site_tagline_fr as string) || '',
      site_tagline_en: (initialData?.site_tagline_en as string) || '',
      site_tagline_ar: (initialData?.site_tagline_ar as string) || '',
      logo_url: (initialData?.logo_url as string) || '',
      favicon_url: (initialData?.favicon_url as string) || '',
      primary_color: (initialData?.primary_color as string) || '#FF6B35',
      secondary_color: (initialData?.secondary_color as string) || '#0c0818',
      accent_color: (initialData?.accent_color as string) || '#F7931E',
      contact_email: (initialData?.contact_email as string) || '',
      contact_phone: (initialData?.contact_phone as string) || '',
      whatsapp_number: (initialData?.whatsapp_number as string) || '',
      business_address: (initialData?.business_address as string) || '',
      facebook_url: (initialData?.facebook_url as string) || '',
      instagram_url: (initialData?.instagram_url as string) || '',
      tiktok_url: (initialData?.tiktok_url as string) || '',
      telegram_url: (initialData?.telegram_url as string) || '',
      youtube_url: (initialData?.youtube_url as string) || '',
      notification_email: (initialData?.notification_email as string) || '',
      meta_pixel_id: (initialData?.meta_pixel_id as string) || '',
      meta_capi_access_token: (initialData?.meta_capi_access_token as string) || '',
      meta_dataset_id: (initialData?.meta_dataset_id as string) || '',
      google_analytics_id: (initialData?.google_analytics_id as string) || '',
      google_ads_id: (initialData?.google_ads_id as string) || '',
      google_ads_conversion_label: (initialData?.google_ads_conversion_label as string) || '',
      tiktok_pixel_id: (initialData?.tiktok_pixel_id as string) || '',
      default_currency: (initialData?.default_currency as string) || 'MAD',
      default_locale: (initialData?.default_locale as 'fr' | 'en' | 'ar') || 'fr',
      thank_you_message_fr: (initialData?.thank_you_message_fr as string) || '',
      thank_you_message_en: (initialData?.thank_you_message_en as string) || '',
      thank_you_message_ar: (initialData?.thank_you_message_ar as string) || '',
      cod_badge_fr: (initialData?.cod_badge_fr as string) || '',
      cod_badge_en: (initialData?.cod_badge_en as string) || '',
      cod_badge_ar: (initialData?.cod_badge_ar as string) || '',
      announcement_enabled: (initialData?.announcement_enabled as boolean) ?? false,
      announcement_text_fr: (initialData?.announcement_text_fr as string) || '',
      announcement_text_en: (initialData?.announcement_text_en as string) || '',
      announcement_text_ar: (initialData?.announcement_text_ar as string) || '',
      hero_eyebrow_fr: (initialData?.hero_eyebrow_fr as string) || '',
      hero_eyebrow_en: (initialData?.hero_eyebrow_en as string) || '',
      hero_eyebrow_ar: (initialData?.hero_eyebrow_ar as string) || '',
      hero_title_accent_fr: (initialData?.hero_title_accent_fr as string) || '',
      hero_title_accent_en: (initialData?.hero_title_accent_en as string) || '',
      hero_title_accent_ar: (initialData?.hero_title_accent_ar as string) || '',
      hero_title_main_fr: (initialData?.hero_title_main_fr as string) || '',
      hero_title_main_en: (initialData?.hero_title_main_en as string) || '',
      hero_title_main_ar: (initialData?.hero_title_main_ar as string) || '',
      hero_subtitle_fr: (initialData?.hero_subtitle_fr as string) || '',
      hero_subtitle_en: (initialData?.hero_subtitle_en as string) || '',
      hero_subtitle_ar: (initialData?.hero_subtitle_ar as string) || '',
      hero_image_url: (initialData?.hero_image_url as string) || '',
      footer_description_fr: (initialData?.footer_description_fr as string) || '',
      footer_description_en: (initialData?.footer_description_en as string) || '',
      footer_description_ar: (initialData?.footer_description_ar as string) || '',
      whatsapp_default_message_fr: (initialData?.whatsapp_default_message_fr as string) || '',
      whatsapp_default_message_en: (initialData?.whatsapp_default_message_en as string) || '',
      whatsapp_default_message_ar: (initialData?.whatsapp_default_message_ar as string) || '',
      trust_1_title_fr: (initialData?.trust_1_title_fr as string) || '',
      trust_1_title_en: (initialData?.trust_1_title_en as string) || '',
      trust_1_title_ar: (initialData?.trust_1_title_ar as string) || '',
      trust_1_sub_fr: (initialData?.trust_1_sub_fr as string) || '',
      trust_1_sub_en: (initialData?.trust_1_sub_en as string) || '',
      trust_1_sub_ar: (initialData?.trust_1_sub_ar as string) || '',
      trust_2_title_fr: (initialData?.trust_2_title_fr as string) || '',
      trust_2_title_en: (initialData?.trust_2_title_en as string) || '',
      trust_2_title_ar: (initialData?.trust_2_title_ar as string) || '',
      trust_2_sub_fr: (initialData?.trust_2_sub_fr as string) || '',
      trust_2_sub_en: (initialData?.trust_2_sub_en as string) || '',
      trust_2_sub_ar: (initialData?.trust_2_sub_ar as string) || '',
      trust_3_title_fr: (initialData?.trust_3_title_fr as string) || '',
      trust_3_title_en: (initialData?.trust_3_title_en as string) || '',
      trust_3_title_ar: (initialData?.trust_3_title_ar as string) || '',
      trust_3_sub_fr: (initialData?.trust_3_sub_fr as string) || '',
      trust_3_sub_en: (initialData?.trust_3_sub_en as string) || '',
      trust_3_sub_ar: (initialData?.trust_3_sub_ar as string) || '',
      trust_1_icon: (initialData?.trust_1_icon as string) || 'Truck',
      trust_2_icon: (initialData?.trust_2_icon as string) || 'Banknote',
      trust_3_icon: (initialData?.trust_3_icon as string) || 'ShieldCheck',
      featured_section_title_fr: (initialData?.featured_section_title_fr as string) || '',
      featured_section_title_en: (initialData?.featured_section_title_en as string) || '',
      featured_section_title_ar: (initialData?.featured_section_title_ar as string) || '',
      featured_section_subtitle_fr: (initialData?.featured_section_subtitle_fr as string) || '',
      featured_section_subtitle_en: (initialData?.featured_section_subtitle_en as string) || '',
      featured_section_subtitle_ar: (initialData?.featured_section_subtitle_ar as string) || '',
      why_us_title_fr: (initialData?.why_us_title_fr as string) || '',
      why_us_title_en: (initialData?.why_us_title_en as string) || '',
      why_us_title_ar: (initialData?.why_us_title_ar as string) || '',
      why_us_sub_fr: (initialData?.why_us_sub_fr as string) || '',
      why_us_sub_en: (initialData?.why_us_sub_en as string) || '',
      why_us_sub_ar: (initialData?.why_us_sub_ar as string) || '',
    },
  });

  const onSubmit = async (data: SettingsFormData) => {
    setSaving(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    const result = await updateSettings(formData);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Paramètres enregistrés');
      reset(data); // Resets dirty state so the save bar hides
    }
  };

  /** True if any of the listed dirty-fields tracker keys are dirty (any locale variant). */
  const isAnyDirty = (...keys: string[]): boolean =>
    keys.some((k) => (dirtyFields as Record<string, unknown>)[k] !== undefined);

  /** True if any of the listed errors are present (any locale variant). */
  const hasAnyError = (...keys: string[]): boolean =>
    keys.some((k) => (errors as Record<string, unknown>)[k] !== undefined);

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!;
  const showLangSwitcher = activeTabConfig.multilingual;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-4xl">
      {/* ====================================================================
          TAB BAR — icon above label on mobile (5-col grid), pills on desktop
          ==================================================================== */}
      <div className="sticky top-0 z-20 -mx-4 lg:mx-0 px-4 lg:px-0 pt-1 pb-2 bg-gray-50">
        {/* Mobile: 5-column grid, icon over label, big touch targets */}
        <div className="lg:hidden grid grid-cols-5 gap-1.5 p-1.5 bg-white rounded-2xl border border-gray-200 shadow-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-col items-center justify-center gap-1 px-1 py-2.5 rounded-xl transition-all min-h-[56px] ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-500 active:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="text-[11px] font-semibold leading-tight truncate w-full text-center">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Desktop: classic horizontal pills */}
        <div className="hidden lg:flex gap-2 flex-wrap">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ====================================================================
          GLOBAL LANGUAGE SWITCHER — only on tabs with multilingual fields
          ==================================================================== */}
      {showLangSwitcher && (
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-gray-200 shadow-sm">
          {(['fr', 'en', 'ar'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLangTab(lang)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                langTab === lang
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {lang === 'fr' ? '🇫🇷 FR' : lang === 'en' ? '🇬🇧 EN' : '🇸🇦 AR'}
            </button>
          ))}
        </div>
      )}

      {/* ====================================================================
          TAB: BRAND
          ==================================================================== */}
      {activeTab === 'brand' && (
        <div className="space-y-3 lg:space-y-5">
          <AdminAccordion
            title="Identité de la marque"
            description="Nom, slogan, logo et favicon"
            icon={<span className="text-base">🏪</span>}
            defaultOpen
            badge={isAnyDirty('site_name', 'site_tagline_fr', 'site_tagline_en', 'site_tagline_ar', 'logo_url', 'favicon_url') && <ModifiedDot />}
          >
            <FormInput label="Nom du site" {...register('site_name')} error={errors.site_name?.message} />
            <FormInput
              label={`Slogan (${langTab.toUpperCase()})`}
              {...register(`site_tagline_${langTab}` as keyof SettingsFormData)}
              placeholder={langTab === 'fr' ? 'Slogan français' : langTab === 'en' ? 'English tagline' : 'الشعار بالعربية'}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
              <SimpleImageUploader
                bucket="brand-assets"
                value={watch('logo_url') || ''}
                onChange={(url) => setValue('logo_url', url, { shouldDirty: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Favicon</label>
              <SimpleImageUploader
                bucket="brand-assets"
                value={watch('favicon_url') || ''}
                onChange={(url) => setValue('favicon_url', url, { shouldDirty: true })}
              />
            </div>
          </AdminAccordion>

          <AdminAccordion
            title="Couleurs de la marque"
            description="Couleur primaire, secondaire et accent"
            icon={<span className="text-base">🎨</span>}
            hasError={hasAnyError('primary_color')}
            badge={isAnyDirty('primary_color', 'secondary_color', 'accent_color') && <ModifiedDot />}
          >
            {(
              [
                { key: 'primary_color' as const, label: 'Primaire', error: errors.primary_color?.message },
                { key: 'secondary_color' as const, label: 'Secondaire', error: undefined },
                { key: 'accent_color' as const, label: 'Accent', error: undefined },
              ] as const
            ).map(({ key, label, error }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={watch(key) || ''}
                    onChange={(e) => setValue(key, e.target.value, { shouldDirty: true, shouldValidate: true })}
                    className="w-10 h-10 rounded cursor-pointer shrink-0"
                  />
                  <input
                    value={watch(key) || ''}
                    onChange={(e) => setValue(key, e.target.value, { shouldDirty: true, shouldValidate: true })}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm font-mono"
                  />
                </div>
                {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
              </div>
            ))}
          </AdminAccordion>
        </div>
      )}

      {/* ====================================================================
          TAB: CONTACT
          ==================================================================== */}
      {activeTab === 'contact' && (
        <div className="space-y-3 lg:space-y-5">
          <AdminAccordion
            title="Coordonnées"
            description="Email, téléphone, WhatsApp et adresse"
            icon={<span className="text-base">📞</span>}
            defaultOpen
            hasError={hasAnyError('contact_email')}
            badge={isAnyDirty('contact_email', 'contact_phone', 'whatsapp_number', 'business_address') && <ModifiedDot />}
          >
            <FormInput label="Email" type="email" {...register('contact_email')} error={errors.contact_email?.message} />
            <FormInput label="Téléphone" {...register('contact_phone')} />
            <FormInput label="WhatsApp" {...register('whatsapp_number')} />
            <FormTextarea label="Adresse" {...register('business_address')} />
          </AdminAccordion>

          <AdminAccordion
            title="Réseaux sociaux"
            description="Liens vers vos pages sociales"
            icon={<span className="text-base">🔗</span>}
            hasError={hasAnyError('facebook_url', 'instagram_url', 'tiktok_url', 'telegram_url', 'youtube_url')}
            badge={isAnyDirty('facebook_url', 'instagram_url', 'tiktok_url', 'telegram_url', 'youtube_url') && <ModifiedDot />}
          >
            <FormInput label="Facebook" {...register('facebook_url')} error={errors.facebook_url?.message} />
            <FormInput label="Instagram" {...register('instagram_url')} error={errors.instagram_url?.message} />
            <FormInput label="TikTok" {...register('tiktok_url')} error={errors.tiktok_url?.message} />
            <FormInput label="Telegram" {...register('telegram_url')} error={errors.telegram_url?.message} />
            <FormInput label="YouTube" {...register('youtube_url')} error={errors.youtube_url?.message} />
          </AdminAccordion>
        </div>
      )}

      {/* ====================================================================
          TAB: HOMEPAGE
          ==================================================================== */}
      {activeTab === 'homepage' && (
        <div className="space-y-3 lg:space-y-5">
          <AdminAccordion
            title="Barre d'annonce"
            description="Bandeau en haut de chaque page"
            icon={<span className="text-base">📢</span>}
            defaultOpen
            badge={isAnyDirty('announcement_enabled', 'announcement_text_fr', 'announcement_text_en', 'announcement_text_ar') && <ModifiedDot />}
          >
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('announcement_enabled')} className="w-4 h-4 accent-orange-600 rounded" />
              <span className="text-sm text-gray-700">Activer la barre d&apos;annonce</span>
            </label>
            <FormInput
              label={`Texte (${langTab.toUpperCase()})`}
              {...register(`announcement_text_${langTab}` as keyof SettingsFormData)}
              placeholder={
                langTab === 'fr' ? 'Ex: Livraison gratuite partout au Maroc' :
                langTab === 'en' ? 'e.g. Free delivery all over Morocco' :
                'مثال: توصيل مجاني في جميع أنحاء المغرب'
              }
            />
            <p className="text-xs text-gray-400">S&apos;affiche en haut de chaque page.</p>
          </AdminAccordion>

          <AdminAccordion
            title="Section Hero"
            description="Bannière principale de la page d'accueil"
            icon={<span className="text-base">🖼️</span>}
            badge={
              isAnyDirty(
                'hero_eyebrow_fr', 'hero_eyebrow_en', 'hero_eyebrow_ar',
                'hero_title_accent_fr', 'hero_title_accent_en', 'hero_title_accent_ar',
                'hero_title_main_fr', 'hero_title_main_en', 'hero_title_main_ar',
                'hero_subtitle_fr', 'hero_subtitle_en', 'hero_subtitle_ar',
                'hero_image_url'
              ) && <ModifiedDot />
            }
          >
            <FormInput
              label="Surtitre"
              {...register(`hero_eyebrow_${langTab}` as keyof SettingsFormData)}
              placeholder={
                langTab === 'fr' ? 'Ex: Édition Limitée · Fait main à Fès' :
                langTab === 'en' ? 'e.g. Limited Edition · Handmade in Fez' :
                'مثال: إصدار محدود · صنع يدوي في فاس'
              }
            />
            <FormInput
              label="Titre accentué"
              {...register(`hero_title_accent_${langTab}` as keyof SettingsFormData)}
              placeholder={
                langTab === 'fr' ? 'Ex: Le cuir berbère' :
                langTab === 'en' ? 'e.g. Berber leather' :
                'مثال: الجلد الأمازيغي'
              }
            />
            <FormInput
              label="Titre principal"
              {...register(`hero_title_main_${langTab}` as keyof SettingsFormData)}
              placeholder={
                langTab === 'fr' ? 'Ex: , livré chez vous en 48h' :
                langTab === 'en' ? 'e.g. , delivered to your door in 48h' :
                'مثال: ، يصلك خلال 48 ساعة'
              }
            />
            <FormTextarea
              label="Sous-titre"
              {...register(`hero_subtitle_${langTab}` as keyof SettingsFormData)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image de fond</label>
              <SimpleImageUploader
                bucket="site-assets"
                value={watch('hero_image_url') || ''}
                onChange={(url) => setValue('hero_image_url', url, { shouldDirty: true })}
              />
              <p className="text-xs text-gray-400 mt-1">Recommandé : 1920×1080 px. Une seule image pour toutes les langues.</p>
            </div>
          </AdminAccordion>

          <AdminAccordion
            title="Produits en vedette"
            description="Titre de la section sur la page d'accueil"
            icon={<span className="text-base">⭐</span>}
            badge={
              isAnyDirty(
                'featured_section_title_fr', 'featured_section_title_en', 'featured_section_title_ar',
                'featured_section_subtitle_fr', 'featured_section_subtitle_en', 'featured_section_subtitle_ar',
              ) && <ModifiedDot />
            }
          >
            <FormInput
              label="Titre de la section"
              {...register(`featured_section_title_${langTab}` as keyof SettingsFormData)}
              placeholder={
                langTab === 'fr' ? "Ex: Pièces phares de l'atelier" :
                langTab === 'en' ? 'e.g. Workshop Highlights' :
                'مثال: أبرز قطع الورشة'
              }
            />
            <FormTextarea
              label="Sous-titre"
              {...register(`featured_section_subtitle_${langTab}` as keyof SettingsFormData)}
            />
            <p className="text-xs text-gray-400">Laissez vide pour utiliser les textes par défaut.</p>
          </AdminAccordion>

          <AdminAccordion
            title="Pourquoi nous ?"
            description="Section d'argumentaire"
            icon={<span className="text-base">💡</span>}
            badge={
              isAnyDirty(
                'why_us_title_fr', 'why_us_title_en', 'why_us_title_ar',
                'why_us_sub_fr', 'why_us_sub_en', 'why_us_sub_ar',
              ) && <ModifiedDot />
            }
          >
            <FormInput
              label="Titre"
              {...register(`why_us_title_${langTab}` as keyof SettingsFormData)}
              placeholder={
                langTab === 'fr' ? 'Ex: Pourquoi nous choisir ?' :
                langTab === 'en' ? 'e.g. Why choose us?' :
                'مثال: لماذا تختارنا؟'
              }
            />
            <FormTextarea
              label="Sous-titre"
              {...register(`why_us_sub_${langTab}` as keyof SettingsFormData)}
            />
          </AdminAccordion>

          <AdminAccordion
            title="Bandeau de confiance"
            description="3 éléments visibles sous le hero"
            icon={<span className="text-base">🛡️</span>}
            badge={
              isAnyDirty(
                'trust_1_title_fr', 'trust_1_title_en', 'trust_1_title_ar',
                'trust_1_sub_fr', 'trust_1_sub_en', 'trust_1_sub_ar', 'trust_1_icon',
                'trust_2_title_fr', 'trust_2_title_en', 'trust_2_title_ar',
                'trust_2_sub_fr', 'trust_2_sub_en', 'trust_2_sub_ar', 'trust_2_icon',
                'trust_3_title_fr', 'trust_3_title_en', 'trust_3_title_ar',
                'trust_3_sub_fr', 'trust_3_sub_en', 'trust_3_sub_ar', 'trust_3_icon',
              ) && <ModifiedDot />
            }
          >
            {([1, 2, 3] as const).map((n) => (
              <div key={n} className="space-y-3 border-l-2 border-orange-200 pl-3 pt-1">
                <h3 className="text-sm font-medium text-orange-700">Élément {n}</h3>
                <FormInput
                  label="Titre"
                  {...register(`trust_${n}_title_${langTab}` as keyof SettingsFormData)}
                  placeholder={
                    n === 1 ? (langTab === 'fr' ? 'Ex: Livraison rapide 24-48h' : langTab === 'en' ? 'e.g. Fast Delivery 24-48h' : 'مثال: توصيل سريع 24-48 ساعة') :
                    n === 2 ? (langTab === 'fr' ? 'Ex: Paiement à la livraison' : langTab === 'en' ? 'e.g. Cash on Delivery' : 'مثال: الدفع عند الاستلام') :
                    (langTab === 'fr' ? 'Ex: Satisfait ou remboursé' : langTab === 'en' ? 'e.g. Satisfied or Refunded' : 'مثال: رضاكم مضمون')
                  }
                />
                <FormInput
                  label="Sous-titre"
                  {...register(`trust_${n}_sub_${langTab}` as keyof SettingsFormData)}
                  placeholder={
                    n === 1 ? (langTab === 'fr' ? 'Ex: Partout au Maroc, suivi inclus' : langTab === 'en' ? 'e.g. All over Morocco, tracking included' : 'مثال: في جميع أنحاء المغرب، مع التتبع') :
                    n === 2 ? (langTab === 'fr' ? 'Ex: Payez à la réception' : langTab === 'en' ? 'e.g. Pay on receipt' : 'مثال: ادفع عند استلام طلبك') :
                    (langTab === 'fr' ? "Ex: 7 jours pour changer d'avis" : langTab === 'en' ? 'e.g. 7 days to change your mind' : 'مثال: 7 أيام لتغيير رأيك')
                  }
                />
                <IconSelect label="Icône" {...register(`trust_${n}_icon` as keyof SettingsFormData)} />
              </div>
            ))}
            <p className="text-xs text-gray-400">Laissez le titre vide pour masquer le bandeau.</p>
          </AdminAccordion>
        </div>
      )}

      {/* ====================================================================
          TAB: INTEGRATIONS (notifications & tracking)
          ==================================================================== */}
      {activeTab === 'integrations' && (
        <div className="space-y-3 lg:space-y-5">
          <AdminAccordion
            title="Notifications"
            description="E-mail pour les nouvelles commandes"
            icon={<span className="text-base">🔔</span>}
            defaultOpen
            hasError={hasAnyError('notification_email')}
            badge={isAnyDirty('notification_email') && <ModifiedDot />}
          >
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              💡 <strong>Important :</strong> les variables d&apos;environnement (Resend, Turnstile, etc.)
              doivent être configurées dans le tableau de bord Vercel → Settings → Environment Variables,
              puis redéployer. Le fichier <code>.env.local</code> n&apos;est pas envoyé sur Vercel.
            </p>
            <div className="space-y-3 border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <span className="text-sm font-semibold text-gray-800">E-mail</span>
              </div>
              <FormInput
                label="Email de notification"
                type="email"
                {...register('notification_email')}
                error={errors.notification_email?.message}
              />
              <button
                type="button"
                disabled={emailTesting}
                onClick={async () => {
                  setEmailTesting(true);
                  const result = await testEmailNotification();
                  setEmailTesting(false);
                  if (result.success) {
                    toast.success('Email de test envoyé — vérifiez votre boîte de réception');
                  } else {
                    toast.error(result.error ?? "Échec de l'envoi de l'email de test");
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 transition-colors"
              >
                {emailTesting ? 'Envoi...' : "Tester l'email"}
              </button>
            </div>
          </AdminAccordion>

          <AdminAccordion
            title="Tracking & Marketing"
            description="Meta, Google, TikTok"
            icon={<span className="text-base">📊</span>}
            badge={
              isAnyDirty(
                'meta_pixel_id', 'meta_capi_access_token', 'meta_dataset_id',
                'google_analytics_id', 'google_ads_id', 'google_ads_conversion_label',
              ) && <ModifiedDot />
            }
          >
            <FormInput label="Meta Pixel ID" {...register('meta_pixel_id')} />
            <FormInput
              label="Meta CAPI Access Token"
              type="password"
              {...register('meta_capi_access_token')}
              helperText={
                secretStatus.hasMetaCapiAccessToken
                  ? 'Un token CAPI est deja enregistre cote serveur. Laissez vide pour le conserver, renseignez une nouvelle valeur pour le remplacer.'
                  : 'Aucun token CAPI enregistre pour le moment.'
              }
            />
            <FormInput label="Meta Dataset ID" {...register('meta_dataset_id')} />
            <FormInput label="Google Analytics ID" {...register('google_analytics_id')} />
            <FormInput label="Google Ads ID" {...register('google_ads_id')} />
            <FormInput
              label="Google Ads Conversion Label"
              {...register('google_ads_conversion_label')}
              helperText="Ex: abcdef1234567890 (trouvé dans Google Ads → Conversions → Tag)"
            />
          </AdminAccordion>
        </div>
      )}

      {/* ====================================================================
          TAB: MESSAGES
          ==================================================================== */}
      {activeTab === 'messages' && (
        <div className="space-y-3 lg:space-y-5">
          <AdminAccordion
            title="Messages clients"
            description="Remerciement et badge COD"
            icon={<span className="text-base">💬</span>}
            defaultOpen
            badge={
              isAnyDirty(
                'thank_you_message_fr', 'thank_you_message_en', 'thank_you_message_ar',
                'cod_badge_fr', 'cod_badge_en', 'cod_badge_ar',
              ) && <ModifiedDot />
            }
          >
            <FormTextarea
              label="Message de remerciement"
              {...register(`thank_you_message_${langTab}` as keyof SettingsFormData)}
              placeholder={langTab === 'fr' ? 'Ex: Merci pour votre commande ! Nous vous contacterons bientôt.' : langTab === 'en' ? 'e.g. Thank you for your order! We will contact you soon.' : 'مثال: شكراً لطلبك! سنتواصل معك قريباً.'}
            />
            <FormInput
              label="Badge paiement à la livraison"
              {...register(`cod_badge_${langTab}` as keyof SettingsFormData)}
              placeholder={langTab === 'fr' ? 'Ex: Paiement à la livraison' : langTab === 'en' ? 'e.g. Cash on Delivery' : 'مثال: الدفع عند الاستلام'}
            />
            <p className="text-xs text-gray-400">Le badge COD s&apos;affiche sur chaque carte produit.</p>
          </AdminAccordion>

          <AdminAccordion
            title="Pied de page"
            description="Description de la marque dans le footer"
            icon={<span className="text-base">📄</span>}
            badge={isAnyDirty('footer_description_fr', 'footer_description_en', 'footer_description_ar') && <ModifiedDot />}
          >
            <FormTextarea
              label="Description de la marque"
              {...register(`footer_description_${langTab}` as keyof SettingsFormData)}
              placeholder={langTab === 'fr' ? 'Ex: Votre boutique de confiance au Maroc.' : langTab === 'en' ? 'e.g. Your trusted store in Morocco.' : 'مثال: متجركم الموثوق في المغرب.'}
            />
          </AdminAccordion>

          <AdminAccordion
            title="Message WhatsApp"
            description="Texte pré-rempli du bouton WhatsApp"
            icon={<span className="text-base">💚</span>}
            badge={isAnyDirty('whatsapp_default_message_fr', 'whatsapp_default_message_en', 'whatsapp_default_message_ar') && <ModifiedDot />}
          >
            <FormInput
              label="Message pré-rempli"
              {...register(`whatsapp_default_message_${langTab}` as keyof SettingsFormData)}
              placeholder={langTab === 'fr' ? "Ex: Bonjour, j'ai une question sur vos produits" : langTab === 'en' ? 'e.g. Hello, I have a question about your products' : 'مثال: مرحبا، لدي سؤال حول منتجاتكم'}
            />
            <p className="text-xs text-gray-400">S&apos;insère automatiquement quand un client clique sur le bouton WhatsApp flottant.</p>
          </AdminAccordion>
        </div>
      )}

      {/* ====================================================================
          SUBMIT — desktop inline + mobile sticky bar
          ==================================================================== */}
      <div className="hidden lg:flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="px-6 py-2.5 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        {isDirty && (
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler les modifications
          </button>
        )}
      </div>

      <StickySaveBar
        visible={isDirty}
        saving={saving}
        saveLabel="Enregistrer"
        onSave={() => handleSubmit(onSubmit)()}
        onDiscard={() => reset()}
        discardLabel="Annuler"
      />

      {/* Spacer so sticky bar doesn't cover the last accordion on mobile */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </form>
  );
}

/** Small orange dot rendered next to a section title when any of its fields have unsaved changes. */
function ModifiedDot() {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full bg-orange-500"
      aria-label="Modifié, non enregistré"
      title="Modifications non enregistrées"
    />
  );
}
