import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { getSiteSettings } from '@/lib/cache/queries';
import { PageHero } from '@/components/public/PageHero';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'navigation' });
  return { title: t('about') };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const settings = await getSiteSettings();

  const siteName = (settings?.site_name as string) || 'Atelier Rif';
  const logoUrl = settings?.logo_url as string | null;
  const primaryColor = (settings?.primary_color as string) || '#FF6B35';

  // Localized story content (hardcoded until CMS fields are added)
  const stories: Record<string, { paragraphs: string[]; values: string[] }> = {
    fr: {
      paragraphs: [
        `Bienvenue chez ${siteName}, une maison de maroquinerie artisanale née au cœur de la médina de Fès. Depuis 2018, nous concevons et fabriquons à la main des sacs et accessoires en cuir véritable, en puisant dans une tradition millénaire de savoir-faire.`,
        `Notre atelier est installé à deux pas de la célèbre tannerie Chouara, où les peaux sont encore aujourd'hui traitées aux extraits végétaux de mimosa et de chêne — une méthode ancestrale qui donne à notre cuir sa souplesse et sa durabilité exceptionnelles. Chaque pièce qui sort de nos mains est unique, portant les initiales de l'artisan qui l'a confectionnée.`,
        `Nous croyons fermement au commerce équitable et à la préservation du patrimoine marocain. C'est pourquoi nous travaillons exclusivement avec des artisans locaux, en leur assurant des conditions de travail dignes et un salaire juste. Aucune chaîne de production, aucune sous-traitance : du cuir brut à la couture finale, tout se passe dans nos ateliers de Fès.`,
        `Notre promesse est simple : vous offrir des pièces intemporelles, fabriquées dans le respect des traditions, avec une qualité qui se ressent au premier toucher. Et parce que nous sommes fiers de notre travail, nous livrons partout au Maroc en 24 à 48 heures, avec la possibilité de payer à la réception.`,
      ],
      values: [
        'Cuir 100% véritable, tanné aux plantes',
        'Fabrication 100% artisanale à Fès',
        'Soutien direct aux artisans locaux',
        'Livraison 24-48h & Paiement à la livraison',
        'Garantie satisfait ou remboursé 7 jours',
      ],
    },
    en: {
      paragraphs: [
        `Welcome to ${siteName}, a handmade leather goods house born in the heart of the Fès medina. Since 2018, we have been designing and handcrafting bags and accessories from genuine leather, drawing on a thousand-year-old tradition of craftsmanship.`,
        `Our workshop is located steps away from the famous Chouara tannery, where hides are still treated with vegetable extracts of mimosa and oak — an ancestral method that gives our leather its exceptional suppleness and durability. Every piece that leaves our hands is unique, bearing the initials of the artisan who crafted it.`,
        `We firmly believe in fair trade and the preservation of Moroccan heritage. That is why we work exclusively with local artisans, ensuring them dignified working conditions and fair wages. No production chain, no subcontracting: from raw leather to final stitching, everything happens in our Fès workshops.`,
        `Our promise is simple: to offer you timeless pieces, made with respect for tradition, with a quality you can feel at first touch. And because we are proud of our work, we deliver everywhere in Morocco within 24 to 48 hours, with the option to pay upon receipt.`,
      ],
      values: [
        '100% genuine vegetable-tanned leather',
        '100% handmade in Fès',
        'Direct support for local artisans',
        '24-48h delivery & Cash on delivery',
        '7-day satisfaction or refund guarantee',
      ],
    },
    ar: {
      paragraphs: [
        `مرحبًا بكم في ${siteName}، دار للمنتجات الجلدية اليدوية ولدت في قلب مدينة فاس العتيقة. منذ عام 2018، نقوم بتصميم وصناعة الحقائب والإكسسوارات يدويًا من الجلد الطبيعي، مستمدين من تقاليد حرفية عمرها آلاف السنين.`,
        `يقع ورشنا على بعد خطوات من دباغة شوارا الشهيرة، حيث لا تزال الجلود تُعالج بمستخلصات نباتية من الميموزا والبلوط — طريقة أسلافية تمنح جلدنا مرونته ومتانته الاستثنائية. كل قطعة تخرج من أيدينا فريدة من نوعها، تحمل أحرف اسم الحرفي الذي صنعها.`,
        `نؤمن بإيمان راسخ بالتجارة العادلة والحفاظ على التراث المغربي. لهذا السبب نعمل حصريًا مع الحرفيين المحليين، مضمنين لهم ظروف عمل لائقة وأجورًا عادلة. لا سلسلة إنتاج، لا مقاولة فرعية: من الجلد الخام إلى الغرزة الأخيرة، كل شيء يحدث في ورش فاس.`,
        `وعدنا بسيط: أن نقدم لك قطعًا خالدة، مصنوعة باحترام للتقاليد، بجودة تشعر بها من أول لمسة. ولأننا فخورون بعملنا، نوصل إلى جميع أنحاء المغرب خلال 24 إلى 48 ساعة، مع إمكانية الدفع عند الاستلام.`,
      ],
      values: [
        'جلد طبيعي 100%، مدبوغ بالنباتات',
        'صناعة يدوية 100% في فاس',
        'دعم مباشر للحرفيين المحليين',
        'توصيل 24-48 ساعة والدفع عند الاستلام',
        'ضمان استعادة الأموال خلال 7 أيام',
      ],
    },
  };

  const content = stories[locale] || stories.fr;
  const isRtl = locale === 'ar';

  return (
    <div>
      <PageHero title={siteName} />

      {/* Story Section */}
      <section className="py-14 lg:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center ${isRtl ? 'lg:direction-rtl' : ''}`}>
            {/* Text Column */}
            <div className={isRtl ? 'lg:order-2' : ''}>
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-px bg-primary" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  {locale === 'fr' ? 'Notre histoire' : locale === 'en' ? 'Our story' : 'قصتنا'}
                </span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-secondary mb-6 leading-tight">
                {locale === 'fr'
                  ? `L'art du cuir, transmis de père en fils dans la médina de Fès`
                  : locale === 'en'
                  ? `The art of leather, passed down from father to son in the Fès medina`
                  : `فن الجلد، يتوارث من الأب إلى الابن في مدينة فاس العتيقة`}
              </h2>
              <div className="space-y-4 text-text-muted leading-relaxed">
                {content.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </div>

            {/* Image Column */}
            <div className={`relative ${isRtl ? 'lg:order-1' : ''}`}>
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface-2">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={siteName}
                    fill
                    className="object-contain p-8"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-2 to-border-warm">
                    <div
                      className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-bold mb-4"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {siteName.charAt(0)}
                    </div>
                    <span className="text-xl font-bold text-secondary">{siteName}</span>
                  </div>
                )}
              </div>
              {/* Decorative element */}
              <div
                className="absolute -bottom-4 -right-4 w-32 h-32 rounded-2xl -z-10 opacity-20"
                style={{ backgroundColor: primaryColor }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-14 lg:py-20 bg-surface-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                {locale === 'fr' ? 'Nos valeurs' : locale === 'en' ? 'Our values' : 'قيمنا'}
              </span>
              <span className="w-8 h-px bg-primary" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-bold text-secondary">
              {locale === 'fr'
                ? 'Ce qui nous guide au quotidien'
                : locale === 'en'
                ? 'What guides us every day'
                : 'ما يوجهنا يوميًا'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {content.values.map((value, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-surface rounded-xl px-5 py-4 border border-border-warm"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${primaryColor}12` }}
                >
                  <svg
                    className="w-4 h-4"
                    style={{ color: primaryColor }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-secondary">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 lg:py-20 bg-secondary relative overflow-hidden">
        <div className="absolute inset-0 moroccan-pattern opacity-20" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            {locale === 'fr'
              ? 'Découvrez nos créations'
              : locale === 'en'
              ? 'Discover our creations'
              : 'اكتشف إبداعاتنا'}
          </h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            {locale === 'fr'
              ? 'Parcourez notre collection de sacs et accessoires en cuir fait main, directement depuis nos ateliers de Fès.'
              : locale === 'en'
              ? 'Browse our collection of handmade leather bags and accessories, straight from our Fès workshops.'
              : 'تصفح مجموعتنا من الحقائب والإكسسوارات الجلدية المصنوعة يدويًا، مباشرة من ورش فاس.'}
          </p>
          <Link
            href="/category/all"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-white text-sm font-semibold rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: primaryColor }}
          >
            {locale === 'fr' ? 'Voir la collection' : locale === 'en' ? 'View collection' : 'عرض المجموعة'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
