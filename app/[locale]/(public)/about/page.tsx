import Image from 'next/image';
import { Link } from '@/lib/i18n/navigation';
import { getSiteSettings } from '@/lib/cache/queries';
import { PageHero } from '@/components/public/PageHero';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shahdmall.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const title = t('aboutTitle');
  const description = t('aboutDescription');
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/${locale}/about`, locale },
    twitter: { card: 'summary_large_image', title, description },
    alternates: {
      canonical: `${SITE_URL}/${locale}/about`,
      languages: { fr: `${SITE_URL}/fr/about`, en: `${SITE_URL}/en/about`, ar: `${SITE_URL}/ar/about` },
    },
  };
}

type AboutRow = {
  section: string;
  key: string;
  order_index: number;
  content_fr: string;
  content_en: string | null;
  content_ar: string | null;
};

async function getAboutContent(locale: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('about_page_content')
    .select('section, key, order_index, content_fr, content_en, content_ar')
    .eq('active', true)
    .order('order_index', { ascending: true });

  const items = (data as AboutRow[] | null) || [];

  const story = items
    .filter((i) => i.section === 'story')
    .sort((a, b) => a.order_index - b.order_index)
    .map((i) => (i[`content_${locale}` as keyof AboutRow] as string | null) || i.content_fr);

  const values = items
    .filter((i) => i.section === 'values')
    .sort((a, b) => a.order_index - b.order_index)
    .map((i) => (i[`content_${locale}` as keyof AboutRow] as string | null) || i.content_fr);

  const ctaMap = new Map<string, string>();
  items
    .filter((i) => i.section === 'cta')
    .forEach((i) => {
      ctaMap.set(i.key, (i[`content_${locale}` as keyof AboutRow] as string | null) || i.content_fr);
    });

  return { story, values, cta: ctaMap };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const settings = await getSiteSettings();
  const dynamic = await getAboutContent(locale);

  const siteName = (settings?.site_name as string) || 'Shahd Mall';
  const logoUrl = settings?.logo_url as string | null;
  const primaryColor = (settings?.primary_color as string) || '#FF6B35';

  // Fallback hardcoded content if DB is empty
  const storiesFallback: Record<string, { paragraphs: string[]; values: string[]; cta: Record<string, string> }> = {
    fr: {
      paragraphs: [
        `Bienvenue chez ${siteName}, votre marketplace en ligne où vous trouverez tout ce dont vous avez besoin au quotidien. Depuis 2018, nous mettons notre énergie à vous offrir une expérience d'achat simple, rapide et fiable — de la mode aux produits électroniques, en passant par la décoration, les accessoires et bien plus encore.`,
        `Notre mission est simple : réunir en un seul endroit une large sélection de produits de qualité, aux meilleurs prix, avec une livraison rapide partout au Maroc. Nous travaillons directement avec des vendeurs et des fournisseurs de confiance pour vous garantir des articles soigneusement sélectionnés.`,
        `Chez ${siteName}, nous croyons que le commerce en ligne doit être accessible à tous. C'est pourquoi nous offrons le paiement à la livraison, une livraison en 24 à 48 heures, et une garantie satisfait ou remboursé de 7 jours. Votre confiance est notre priorité.`,
        `Notre promesse est simple : vous offrir le meilleur du shopping en ligne au Maroc. Une plateforme fiable, des prix compétitifs, et un service client à votre écoute à chaque étape de votre commande.`,
      ],
      values: [
        'Produits soigneusement sélectionnés',
        'Prix compétitifs sans intermédiaires',
        'Livraison rapide 24-48h partout au Maroc',
        'Paiement à la livraison',
        'Garantie satisfait ou remboursé 7 jours',
      ],
      cta: {
        title: 'Découvrez nos produits',
        subtitle: `Parcourez notre catalogue et trouvez tout ce qu'il vous faut, livré rapidement chez vous.`,
        button: 'Voir la collection',
      },
    },
    en: {
      paragraphs: [
        `Welcome to ${siteName}, your online marketplace where you can find everything you need for everyday life. Since 2018, we have been dedicated to offering you a simple, fast, and reliable shopping experience — from fashion and electronics to home décor, accessories, and much more.`,
        `Our mission is simple: to bring together a wide selection of quality products at the best prices, with fast delivery across Morocco. We work directly with trusted sellers and suppliers to ensure carefully selected items for you.`,
        `At ${siteName}, we believe online shopping should be accessible to everyone. That is why we offer cash on delivery, 24 to 48 hour delivery, and a 7-day satisfaction or refund guarantee. Your trust is our priority.`,
        `Our promise is simple: to offer you the best online shopping experience in Morocco. A reliable platform, competitive prices, and customer service that listens to you at every step of your order.`,
      ],
      values: [
        'Carefully selected products',
        'Competitive prices with no middlemen',
        'Fast 24-48h delivery across Morocco',
        'Cash on delivery',
        '7-day satisfaction or refund guarantee',
      ],
      cta: {
        title: 'Discover our products',
        subtitle: `Browse our catalog and find everything you need, delivered quickly to your door.`,
        button: 'View collection',
      },
    },
    ar: {
      paragraphs: [
        `مرحبًا بكم في ${siteName}، سوقكم الإلكتروني حيث تجدون كل ما تحتاجونه في حياتكم اليومية. منذ عام 2018، نكرس جهودنا لتقديم تجربة تسوق بسيطة وسريعة وموثوقة — من الأزياء والإلكترونيات إلى الديكور والإكسسوارات وغير ذلك الكثير.`,
        `مهمتنا بسيطة: توفير تشكيلة واسعة من المنتجات عالية الجودة بأفضل الأسعار، مع توصيل سريع إلى جميع أنحاء المغرب. نعمل مباشرة مع بائعين وموردين موثوقين لنضمن لكم منتجات مختارة بعناية.`,
        `في ${siteName}، نؤمن بأن التسوق عبر الإنترنت يجب أن يكون في متناول الجميع. لهذا السبب نقدم الدفع عند الاستلام، والتوصيل خلال 24 إلى 48 ساعة، وضمان استعادة الأموال خلال 7 أيام. ثقتكم هي أولويتنا.`,
        `وعدنا بسيط: أن نقدم لكم أفضل تجربة تسوق إلكتروني في المغرب. منصة موثوقة، وأسعار تنافسية، وخدمة عملاء تستمع إليكم في كل خطوة من طلباتكم.`,
      ],
      values: [
        'منتجات مختارة بعناية',
        'أسعار تنافسية بدون وسطاء',
        'توصيل سريع 24-48 ساعة في جميع أنحاء المغرب',
        'الدفع عند الاستلام',
        'ضمان استعادة الأموال خلال 7 أيام',
      ],
      cta: {
        title: 'اكتشف منتجاتنا',
        subtitle: `تصفح كتالوجنا واعثر على كل ما تحتاجه، يُوصّل بسرعة إلى باب منزلك.`,
        button: 'عرض المجموعة',
      },
    },
  };

  const fallback = storiesFallback[locale] || storiesFallback.fr;

  const storyParagraphs = dynamic.story.length > 0 ? dynamic.story : fallback.paragraphs;
  const valuesList = dynamic.values.length > 0 ? dynamic.values : fallback.values;
  const ctaTitle = dynamic.cta.get('title') || fallback.cta.title;
  const ctaSubtitle = dynamic.cta.get('subtitle') || fallback.cta.subtitle;
  const ctaButton = dynamic.cta.get('button') || fallback.cta.button;

  const storyHeading =
    locale === 'fr'
      ? `Votre marketplace au Maroc`
      : locale === 'en'
        ? `Your marketplace in Morocco`
        : `سوقكم في المغرب`;

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
                {storyHeading}
              </h2>
              <div className="space-y-4 text-text-muted leading-relaxed">
                {storyParagraphs.map((p, i) => (
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
            {valuesList.map((value, i) => (
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
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">{ctaTitle}</h2>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">{ctaSubtitle}</p>
          <Link
            href="/category/all"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-white text-sm font-semibold rounded-full transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: primaryColor }}
          >
            {ctaButton}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
