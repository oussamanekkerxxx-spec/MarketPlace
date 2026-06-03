import { getSiteSettings } from '@/lib/cache/queries';
import { Link } from '@/lib/i18n/navigation';
import { ChevronRight, FileText } from 'lucide-react';
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
  const title = t('termsTitle');
  const description = t('termsDescription');
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/${locale}/terms`, locale },
    twitter: { card: 'summary_large_image', title, description },
    alternates: {
      canonical: `${SITE_URL}/${locale}/terms`,
      languages: { fr: `${SITE_URL}/fr/terms`, en: `${SITE_URL}/en/terms`, ar: `${SITE_URL}/ar/terms` },
    },
  };
}

export default async function TermsPage({
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
      subtitle: 'Conditions de vente',
      title: 'Conditions générales de vente',
      updated: 'Dernière mise à jour',
      home: 'Accueil',
      sections: [
        'Objet',
        'Produits et prix',
        'Commande',
        'Paiement',
        'Livraison',
        'Droit de rétractation',
        'Garantie',
        'Responsabilité',
        'Litiges',
        'Contact',
      ],
    },
    en: {
      subtitle: 'Terms of Sale',
      title: 'General Terms and Conditions of Sale',
      updated: 'Last updated',
      home: 'Home',
      sections: [
        'Purpose',
        'Products and Prices',
        'Order',
        'Payment',
        'Delivery',
        'Right of Withdrawal',
        'Warranty',
        'Liability',
        'Disputes',
        'Contact',
      ],
    },
    ar: {
      subtitle: 'شروط البيع',
      title: 'الشروط العامة للبيع',
      updated: 'آخر تحديث',
      home: 'الرئيسية',
      sections: [
        'الغرض',
        'المنتجات والأسعار',
        'الطلب',
        'الدفع',
        'التوصيل',
        'حق الانسحاب',
        'الضمان',
        'المسؤولية',
        'النزاعات',
        'الاتصال',
      ],
    },
  };

  const l = labels[locale as keyof typeof labels] || labels.fr;

  return (
    <div className={`bg-background min-h-screen ${isRtl ? 'rtl' : ''}`}>
      {/* Page Hero */}
      <section className="relative bg-secondary overflow-hidden">
        <div className="absolute inset-0 moroccan-pattern opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-accent" />
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
          <span className="text-secondary font-medium">{l.subtitle}</span>
        </nav>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <ScrollReveal>
          <div className="prose max-w-none text-text-muted space-y-6">
            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  1
                </span>
                {l.sections[0]}
              </h2>
              <p>
                Les présentes conditions générales de vente (CGV) régissent les relations contractuelles
                entre <strong className="text-secondary">{siteName}</strong> et tout client effectuant un achat sur notre site.
                En passant commande, vous acceptez sans réserve l'intégralité des présentes CGV.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  2
                </span>
                {l.sections[1]}
              </h2>
              <p>
                Les produits proposés sont décrits et illustrés avec la plus grande exactitude possible.
                Les prix sont indiqués en Dirhams Marocains (MAD), TTC. {siteName} se réserve le droit
                de modifier ses prix à tout moment, sans préavis. Les produits sont facturés sur la base
                des tarifs en vigueur au moment de la validation de la commande.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  3
                </span>
                {l.sections[2]}
              </h2>
              <p>
                La commande est validée après remplissage du formulaire de réservation et confirmation
                par téléphone de notre part. Nous nous réservons le droit de refuser ou d'annuler toute
                commande en cas de suspicion de fraude, de fausse identité ou d'indisponibilité du produit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  4
                </span>
                {l.sections[3]}
              </h2>
              <p>
                Le paiement s'effectue exclusivement à la livraison, en espèces, auprès du livreur.
                Aucun paiement en ligne n'est requis. Le montant total à payer inclut le prix du produit
                et les frais de livraison affichés avant validation de la commande.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  5
                </span>
                {l.sections[4]}
              </h2>
              <p>
                La livraison est effectuée à l'adresse indiquée lors de la commande. Les délais de livraison
                sont donnés à titre indicatif :
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Grandes villes (Casablanca, Rabat, Marrakech, Tanger, Fès) : 24-48h</li>
                <li>Villes moyennes : 2-4 jours ouvrés</li>
                <li>Zones rurales : 4-7 jours ouvrés</li>
              </ul>
              <p>
                {siteName} ne saurait être tenu responsable des retards imputables au transporteur ou
                à des cas de force majeure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  6
                </span>
                {l.sections[5]}
              </h2>
              <p>
                Conformément à la législation marocaine, vous disposez d'un délai de 7 jours à compter
                de la réception pour exercer votre droit de rétractation. Les produits doivent être
                retournés dans leur emballage d'origine, non utilisés et en parfait état.
                Les frais de retour sont à la charge du client.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  7
                </span>
                {l.sections[6]}
              </h2>
              <p>
                Tous nos produits bénéficient d'une garantie de conformité de 6 mois à compter de la livraison.
                En cas de produit défectueux ou non conforme, contactez-nous dans les 48h suivant la réception
                pour organiser un échange ou un remboursement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  8
                </span>
                {l.sections[7]}
              </h2>
              <p>
                {siteName} ne saurait être tenu pour responsable de l'inexécution du contrat en cas de
                force majeure, de perturbation ou de grève totale ou partielle des services postaux
                et moyens de transport et/ou communications.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  9
                </span>
                {l.sections[8]}
              </h2>
              <p>
                Les présentes CGV sont soumises au droit marocain. En cas de litige, une solution amiable
                sera recherchée en priorité. À défaut, les tribunaux compétents seront ceux du lieu
                du siège social de {siteName}.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-secondary mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: primaryColor }}>
                  10
                </span>
                {l.sections[9]}
              </h2>
              <p>
                Pour toute question relative aux présentes CGV, contactez-nous via la page{' '}
                <Link href="/contact" className="text-primary hover:underline font-medium">Contact</Link>.
              </p>
            </section>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
