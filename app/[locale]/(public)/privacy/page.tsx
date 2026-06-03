import { getSiteSettings } from '@/lib/cache/queries';
import { Link } from '@/lib/i18n/navigation';
import { ChevronRight, Shield } from 'lucide-react';
import { ScrollReveal } from '@/components/public/ScrollReveal';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

export const revalidate = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shahdmall.com';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  const title = t('privacyTitle');
  const description = t('privacyDescription');
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/${locale}/privacy`, locale },
    twitter: { card: 'summary_large_image', title, description },
    alternates: {
      canonical: `${SITE_URL}/${locale}/privacy`,
      languages: { fr: `${SITE_URL}/fr/privacy`, en: `${SITE_URL}/en/privacy`, ar: `${SITE_URL}/ar/privacy` },
    },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const settings = await getSiteSettings();
  const siteName = (settings?.site_name as string) || 'Notre boutique';
  const primaryColor = (settings?.primary_color as string) || '#FF6B35';
  const isRtl = locale === 'ar';

  const labels = {
    fr: {
      subtitle: 'Confidentialité',
      title: 'Politique de confidentialité',
      updated: 'Dernière mise à jour',
      home: 'Accueil',
      sections: [
        'Collecte des données',
        'Utilisation des données',
        'Cookies',
        'Partage des données',
        'Conservation',
        'Vos droits',
      ],
      content: {
        collection: {
          intro: 'Nous collectons uniquement les informations strictement nécessaires au traitement et à la livraison de vos commandes :',
          items: [
            { label: 'Identité', text: 'nom et prénom pour la préparation et la livraison de votre colis' },
            { label: 'Contact', text: 'numéro de téléphone pour la confirmation de commande et la coordination avec le livreur' },
            { label: 'Adresse', text: 'ville et adresse de livraison complète' },
            { label: 'Commandes', text: 'historique de vos achats et préférences de produits' },
          ],
          outro: 'Nous ne collectons aucune donnée bancaire. Le paiement s\'effectue intégralement à la livraison, en espèces.',
        },
        usage: {
          intro: 'Vos données personnelles sont utilisées exclusivement dans les cas suivants :',
          items: [
            { label: '', text: 'Traiter, expédier et suivre vos commandes jusqu\'à réception' },
            { label: '', text: 'Vous contacter en cas de question ou de problème concernant votre commande' },
            { label: '', text: 'Améliorer la qualité de nos services et de notre catalogue produits' },
            { label: '', text: 'Respecter nos obligations légales et réglementaires' },
          ],
          outro: '',
        },
        cookies: {
          intro: 'Notre site utilise des cookies pour garantir son bon fonctionnement et améliorer votre expérience. Deux catégories sont utilisées :',
          items: [
            { label: 'Cookies essentiels', text: 'indispensables au fonctionnement technique du site (panier, session utilisateur, préférences de langue). Ils ne peuvent pas être désactivés.' },
            { label: 'Cookies marketing', text: 'utilisés pour mesurer l\'efficacité de nos campagnes publicitaires (Meta Pixel). Ces cookies ne sont activés qu\'après votre consentement explicite via la bannière de cookies.' },
          ],
          outro: 'Vous pouvez modifier vos préférences à tout moment en cliquant sur le bouton de gestion des cookies situé en bas de page.',
        },
        sharing: {
          intro: `${siteName} ne vend pas, ne loue pas et ne cède pas vos données personnelles à des tiers. Elles ne sont communiquées qu\'aux destinataires suivants, dans la stricte mesure nécessaire :`,
          items: [
            { label: '', text: 'Notre prestataire de livraison, uniquement pour les données indispensables à la remise du colis (nom, téléphone et adresse)' },
            { label: '', text: 'Les autorités administratives ou judiciaires compétentes, en cas d\'obligation légale ou de demande fondée' },
          ],
          outro: '',
        },
        retention: {
          intro: '',
          items: [],
          outro: `Vos données sont conservées pendant une durée de trois (3) ans à compter de votre dernière commande, conformément à la législation marocaine en vigueur. Passé ce délai, elles sont supprimées de manière sécurisée. Vous pouvez demander leur suppression anticipée à tout moment en nous contactant via la page Contact.`,
        },
        rights: {
          intro: 'Conformément à la loi n° 09-08 relative à la protection des données à caractère personnel, vous disposez des droits suivants :',
          items: [
            { label: '', text: 'Droit d\'accès : obtenir une copie de vos données personnelles que nous détenons' },
            { label: '', text: 'Droit de rectification : corriger toute information inexacte ou incomplète' },
            { label: '', text: 'Droit de suppression (« droit à l\'oubli ») : demander l\'effacement de vos données' },
            { label: '', text: 'Droit d\'opposition : vous opposer au traitement de vos données pour des motifs légitimes' },
          ],
          outro: `Pour exercer l\'un de ces droits, ou pour toute question relative à la protection de vos données, contactez-nous via la page `,
        },
      },
    },
    en: {
      subtitle: 'Privacy',
      title: 'Privacy Policy',
      updated: 'Last updated',
      home: 'Home',
      sections: [
        'Data Collection',
        'Data Usage',
        'Cookies',
        'Data Sharing',
        'Retention',
        'Your Rights',
      ],
      content: {
        collection: {
          intro: 'We collect only the information strictly necessary to process and deliver your orders:',
          items: [
            { label: 'Identity', text: 'first and last name for order preparation and delivery' },
            { label: 'Contact', text: 'phone number for order confirmation and coordination with the courier' },
            { label: 'Address', text: 'city and full delivery address' },
            { label: 'Orders', text: 'purchase history and product preferences' },
          ],
          outro: 'We do not collect any banking information. Payment is made entirely in cash upon delivery.',
        },
        usage: {
          intro: 'Your personal data is used strictly for the following purposes:',
          items: [
            { label: '', text: 'Processing, shipping, and tracking your orders until delivery' },
            { label: '', text: 'Contacting you regarding any questions or issues with your order' },
            { label: '', text: 'Improving the quality of our services and product catalog' },
            { label: '', text: 'Complying with our legal and regulatory obligations' },
          ],
          outro: '',
        },
        cookies: {
          intro: 'Our website uses cookies to ensure proper functionality and enhance your experience. Two categories are used:',
          items: [
            { label: 'Essential cookies', text: 'necessary for the technical operation of the site (shopping cart, user session, language preferences). These cannot be disabled.' },
            { label: 'Marketing cookies', text: 'used to measure the effectiveness of our advertising campaigns (Meta Pixel). These cookies are only activated after your explicit consent via the cookie banner.' },
          ],
          outro: 'You can change your preferences at any time by clicking the cookie management button at the bottom of the page.',
        },
        sharing: {
          intro: `${siteName} does not sell, rent, or transfer your personal data to third parties. It is only shared with the following recipients, to the strictly necessary extent:`,
          items: [
            { label: '', text: 'Our delivery provider, solely for the data required to hand over the package (name, phone number, and address)' },
            { label: '', text: 'Competent administrative or judicial authorities, in cases of legal obligation or justified request' },
          ],
          outro: '',
        },
        retention: {
          intro: '',
          items: [],
          outro: `Your data is retained for a period of three (3) years from your last order, in accordance with applicable Moroccan law. After this period, it is securely deleted. You may request early deletion at any time by contacting us through the Contact page.`,
        },
        rights: {
          intro: 'In accordance with Law No. 09-08 on the protection of personal data, you have the following rights:',
          items: [
            { label: '', text: 'Right of access: obtain a copy of the personal data we hold about you' },
            { label: '', text: 'Right to rectification: correct any inaccurate or incomplete information' },
            { label: '', text: 'Right to erasure ("right to be forgotten"): request deletion of your data' },
            { label: '', text: 'Right to object: object to the processing of your data on legitimate grounds' },
          ],
          outro: `To exercise any of these rights, or for any questions regarding data protection, please contact us through the `,
        },
      },
    },
    ar: {
      subtitle: 'الخصوصية',
      title: 'سياسة الخصوصية',
      updated: 'آخر تحديث',
      home: 'الرئيسية',
      sections: [
        'جمع البيانات',
        'استخدام البيانات',
        'ملفات تعريف الارتباط',
        'مشاركة البيانات',
        'الاحتفاظ بالبيانات',
        'حقوقك',
      ],
      content: {
        collection: {
          intro: 'نقوم بجمع المعلومات الضرورية فقط لمعالجة طلباتكم وتوصيلها:',
          items: [
            { label: 'الهوية', text: 'الاسم واللقب لتحضير الطلبية وتسليمها' },
            { label: 'الاتصال', text: 'رقم الهاتف لتأكيد الطلبية والتنسيق مع مندوب التوصيل' },
            { label: 'العنوان', text: 'المدينة وعنوان التوصيل الكامل' },
            { label: 'الطلبيات', text: 'سجل مشترياتكم وتفضيلاتكم من المنتجات' },
          ],
          outro: 'لا نقوم بجمع أي بيانات مصرفية. يتم الدفع نقداً عند التسليم بالكامل.',
        },
        usage: {
          intro: 'تُستخدم بياناتكم الشخصية حصرياً في الحالات التالية:',
          items: [
            { label: '', text: 'معالجة طلبياتكم وشحنها وتتبعها إلى حين استلامها' },
            { label: '', text: 'التواصل معكم في حال وجود أي سؤال أو مشكلة تتعلق بطلبيتكم' },
            { label: '', text: 'تحسين جودة خدماتنا وكتالوج منتجاتنا' },
            { label: '', text: 'الالتزام بالالتزامات القانونية والتنظيمية المفروضة علينا' },
          ],
          outro: '',
        },
        cookies: {
          intro: 'يستخدم موقعنا ملفات تعريف الارتباط (الكوكيز) لضمان عمله السليم وتحسين تجربتكم. يتم استخدام فئتين:',
          items: [
            { label: 'ملفات تعريف الارتباط الأساسية', text: 'ضرورية للتشغيل التقني للموقع (عربة التسوق، جلسة المستخدم، تفضيلات اللغة). لا يمكن تعطيلها.' },
            { label: 'ملفات تعريف الارتباط التسويقية', text: 'تُستخدم لقياس فعالية حملاتنا الإعلانية (ميتا بيكسل). يتم تفعيلها فقط بعد موافقتكم الصريحة عبر شريط ملفات تعريف الارتباط.' },
          ],
          outro: 'يمكنكم تعديل تفضيلاتكم في أي وقت بالنقر على زر إدارة ملفات تعريف الارتباط الموجود في أسفل الصفحة.',
        },
        sharing: {
          intro: `لا يقوم ${siteName} ببيع أو تأجير أو نقل بياناتكم الشخصية إلى أطراف ثالثة. تُشارك فقط مع الجهات التالية، وفي الحد الضروري فقط:`,
          items: [
            { label: '', text: 'مقدم خدمة التوصيل لدينا، وللمعطيات الضرورية فقط لتسليم الطرد (الاسم، رقم الهاتف، والعنوان)' },
            { label: '', text: 'السلطات الإدارية أو القضائية المختصة، في حالات الالتزام القانوني أو الطلب المبرر' },
          ],
          outro: '',
        },
        retention: {
          intro: '',
          items: [],
          outro: `تُحفظ بياناتكم لمدة ثلاث (3) سنوات ابتداءً من آخر طلبية لكم، وفقاً للتشريع المغربي النافذ. بعد انقضاء هذه المدة، تُحذف بشكل آمن. يمكنكم طلب حذفها المسبق في أي وقت بالاتصال بنا عبر صفحة الاتصال.`,
        },
        rights: {
          intro: 'وفقاً للقانون رقم 09-08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي، تتمتعون بالحقوق التالية:',
          items: [
            { label: '', text: 'حق الولوج: الحصول على نسخة من المعطيات الشخصية التي نحتفظ بها عنكم' },
            { label: '', text: 'حق الت rectification: تصحيح أي معلومة غير دقيقة أو ناقصة' },
            { label: '', text: 'حق الحذف («الحق في النسيان»): طريق حذف معطياتكم' },
            { label: '', text: 'حق الاعتراض: الاعتراض على معالجة معطياتكم لأسباب مشروعة' },
          ],
          outro: `لممارسة أي من هذه الحقوق، أو لأي سؤال يتعلق بحماية المعطيات، يرجى الاتصال بنا عبر صفحة `,
        },
      },
    },
  };

  const l = labels[locale as keyof typeof labels] || labels.fr;
  const c = l.content;

  return (
    <div className={`bg-background min-h-screen ${isRtl ? 'rtl' : ''}`}>
      {/* Page Hero */}
      <section className="relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 moroccan-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-accent" />
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                {l.subtitle}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[1.1] tracking-tight text-white">
              {l.title}
            </h1>
            <p className="mt-3 text-sm text-white/60">
              {l.updated} : {new Date().toLocaleDateString(locale === 'ar' ? 'ar-MA' : locale === 'en' ? 'en-US' : 'fr-FR')}
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-sm text-text-muted">
          <Link href="/" className="hover:text-primary transition-colors">{l.home}</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-secondary font-medium">{l.title}</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <ScrollReveal>
          <div className="prose max-w-none text-text-muted space-y-6">
            {/* 1. Data Collection */}
            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  1
                </span>
                {l.sections[0]}
              </h2>
              {c.collection.intro && <p>{c.collection.intro}</p>}
              {c.collection.items.length > 0 && (
                <ul className="list-disc pl-5 space-y-1.5">
                  {c.collection.items.map((item, i) => (
                    <li key={i}>
                      {item.label && <strong className="text-secondary">{item.label}</strong>}
                      {item.label && item.text ? ' : ' : ''}
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
              {c.collection.outro && <p>{c.collection.outro}</p>}
            </section>

            {/* 2. Data Usage */}
            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  2
                </span>
                {l.sections[1]}
              </h2>
              {c.usage.intro && <p>{c.usage.intro}</p>}
              {c.usage.items.length > 0 && (
                <ul className="list-disc pl-5 space-y-1.5">
                  {c.usage.items.map((item, i) => (
                    <li key={i}>{item.text}</li>
                  ))}
                </ul>
              )}
              {c.usage.outro && <p>{c.usage.outro}</p>}
            </section>

            {/* 3. Cookies */}
            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  3
                </span>
                {l.sections[2]}
              </h2>
              {c.cookies.intro && <p>{c.cookies.intro}</p>}
              {c.cookies.items.length > 0 && (
                <ul className="list-disc pl-5 space-y-1.5">
                  {c.cookies.items.map((item, i) => (
                    <li key={i}>
                      <strong className="text-secondary">{item.label}</strong> : {item.text}
                    </li>
                  ))}
                </ul>
              )}
              {c.cookies.outro && <p>{c.cookies.outro}</p>}
            </section>

            {/* 4. Data Sharing */}
            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  4
                </span>
                {l.sections[3]}
              </h2>
              {c.sharing.intro && <p>{c.sharing.intro}</p>}
              {c.sharing.items.length > 0 && (
                <ul className="list-disc pl-5 space-y-1.5">
                  {c.sharing.items.map((item, i) => (
                    <li key={i}>{item.text}</li>
                  ))}
                </ul>
              )}
              {c.sharing.outro && <p>{c.sharing.outro}</p>}
            </section>

            {/* 5. Retention */}
            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  5
                </span>
                {l.sections[4]}
              </h2>
              {c.retention.outro && <p>{c.retention.outro}</p>}
            </section>

            {/* 6. Your Rights */}
            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  6
                </span>
                {l.sections[5]}
              </h2>
              {c.rights.intro && <p>{c.rights.intro}</p>}
              {c.rights.items.length > 0 && (
                <ul className="list-disc pl-5 space-y-1.5">
                  {c.rights.items.map((item, i) => (
                    <li key={i}>{item.text}</li>
                  ))}
                </ul>
              )}
              {c.rights.outro && (
                <p>
                  {c.rights.outro}
                  <Link href="/contact" className="text-primary hover:underline font-medium">
                    {locale === 'ar' ? 'الاتصال' : locale === 'en' ? 'Contact' : 'Contact'}
                  </Link>.
                </p>
              )}
            </section>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
