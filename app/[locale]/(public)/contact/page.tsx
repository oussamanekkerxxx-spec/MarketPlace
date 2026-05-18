import { getSiteSettings } from '@/lib/cache/queries';
import { PageHero } from '@/components/public/PageHero';
import { Phone, Mail, MapPin, MessageCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'navigation' });
  return { title: t('contact') };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const settings = await getSiteSettings();

  const primaryColor = (settings?.primary_color as string) || '#FF6B35';

  const phone = settings?.contact_phone as string | null;
  const email = settings?.contact_email as string | null;
  const whatsapp = settings?.whatsapp_number as string | null;
  const address = settings?.business_address as string | null;

  const facebookUrl = settings?.facebook_url as string | null;
  const instagramUrl = settings?.instagram_url as string | null;
  const tiktokUrl = settings?.tiktok_url as string | null;
  const telegramUrl = settings?.telegram_url as string | null;
  const youtubeUrl = settings?.youtube_url as string | null;

  const hasSocials = !!(facebookUrl || instagramUrl || tiktokUrl || telegramUrl || youtubeUrl);

  const t = {
    fr: {
      title: 'Contactez-nous',
      subtitle: `Une question sur une commande, un produit ou une collaboration ? Notre équipe vous répond du lundi au samedi, de 9h à 19h.`,
      phone: 'Téléphone',
      phoneHours: 'Lun-Sam, 9h-19h',
      whatsapp: 'WhatsApp',
      whatsappReply: 'Réponse rapide garantie',
      email: 'Email',
      emailReply: 'Réponse sous 24h',
      addressLabel: 'Adresse',
      addressType: 'Siège social',
      savTitle: 'Service après-vente',
      savText: 'Pour toute réclamation ou demande de retour, contactez-nous directement par téléphone ou WhatsApp avec votre numéro de commande. Nous traitons chaque demande sous 48h ouvrées.',
      socialsTitle: 'Nos réseaux sociaux',
    },
    en: {
      title: 'Contact us',
      subtitle: `Have a question about an order, a product, or a collaboration? Our team is available Monday to Saturday, 9am to 7pm.`,
      phone: 'Phone',
      phoneHours: 'Mon-Sat, 9am-7pm',
      whatsapp: 'WhatsApp',
      whatsappReply: 'Fast reply guaranteed',
      email: 'Email',
      emailReply: 'Reply within 24h',
      addressLabel: 'Address',
      addressType: 'Head office',
      savTitle: 'After-sales service',
      savText: 'For any claim or return request, contact us directly by phone or WhatsApp with your order number. We process each request within 48 business hours.',
      socialsTitle: 'Follow us',
    },
    ar: {
      title: 'اتصل بنا',
      subtitle: `لديك سؤال حول طلب أو منتج أو تعاون؟ فريقنا متاح من الاثنين إلى السبت، من 9 صباحًا إلى 7 مساءً.`,
      phone: 'الهاتف',
      phoneHours: 'السبت-الأحد، 9ص-7م',
      whatsapp: 'واتساب',
      whatsappReply: 'رد سريع مضمون',
      email: 'البريد الإلكتروني',
      emailReply: 'رد خلال 24 ساعة',
      addressLabel: 'العنوان',
      addressType: 'المقر الرئيسي',
      savTitle: 'خدمة ما بعد البيع',
      savText: 'لأي مطالبة أو طلب إرجاع، اتصل بنا مباشرة عبر الهاتف أو واتساب مع رقم طلبك. نعالج كل طلب خلال 48 ساعة عمل.',
      socialsTitle: 'تابعنا',
    },
  };

  const labels = t[locale as keyof typeof t] || t.fr;

  const contactCards = [
    phone && {
      href: `tel:${phone}`,
      icon: Phone,
      title: labels.phone,
      value: phone,
      note: labels.phoneHours,
    },
    whatsapp && {
      href: `https://wa.me/${whatsapp.replace(/\D/g, '')}?text=Bonjour,%20j'ai%20une%20question`,
      icon: MessageCircle,
      title: labels.whatsapp,
      value: whatsapp,
      note: labels.whatsappReply,
      external: true,
    },
    email && {
      href: `mailto:${email}`,
      icon: Mail,
      title: labels.email,
      value: email,
      note: labels.emailReply,
    },
    address && {
      href: null,
      icon: MapPin,
      title: labels.addressLabel,
      value: address,
      note: labels.addressType,
    },
  ].filter(Boolean) as {
    href: string | null;
    icon: typeof Phone;
    title: string;
    value: string;
    note: string;
    external?: boolean;
  }[];

  const CardWrapper = ({
    href,
    external,
    children,
  }: {
    href: string | null;
    external?: boolean;
    children: React.ReactNode;
  }) => {
    if (!href) {
      return (
        <div className="flex items-start gap-4 p-6 bg-surface border border-border-warm rounded-xl">
          {children}
        </div>
      );
    }
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className="flex items-start gap-4 p-6 bg-surface border border-border-warm rounded-xl hover:shadow-md transition-shadow"
      >
        {children}
      </a>
    );
  };

  return (
    <div>
      <PageHero title={labels.title} subtitle={labels.subtitle} />

      <section className="py-14 lg:py-20 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {contactCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <CardWrapper key={i} href={card.href} external={card.external}>
                  <div
                    className="p-3 rounded-lg shrink-0"
                    style={{ backgroundColor: `${primaryColor}12` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: primaryColor }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary">{card.title}</h3>
                    <p className="text-text-muted mt-1">{card.value}</p>
                    <p className="text-sm text-text-muted/70 mt-1">{card.note}</p>
                  </div>
                </CardWrapper>
              );
            })}
          </div>

          {/* SAV Section */}
          <div className="mt-10 p-6 bg-surface-2 border border-border-warm rounded-xl">
            <h2 className="font-semibold text-secondary mb-2">{labels.savTitle}</h2>
            <p className="text-text-muted text-sm leading-relaxed">{labels.savText}</p>
          </div>

          {/* Social Networks */}
          {hasSocials && (
            <div className="mt-6 p-6 bg-surface border border-border-warm rounded-xl">
              <h2 className="font-semibold text-secondary mb-4">{labels.socialsTitle}</h2>
              <div className="flex flex-wrap gap-3">
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-warm bg-surface-2 hover:shadow-md transition-shadow text-sm font-medium text-secondary"
                  >
                    <FacebookIcon className="w-5 h-5 text-[#1877F2]" />
                    Facebook
                  </a>
                )}
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-warm bg-surface-2 hover:shadow-md transition-shadow text-sm font-medium text-secondary"
                  >
                    <InstagramIcon className="w-5 h-5 text-[#E1306C]" />
                    Instagram
                  </a>
                )}
                {tiktokUrl && (
                  <a
                    href={tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-warm bg-surface-2 hover:shadow-md transition-shadow text-sm font-medium text-secondary"
                  >
                    <TikTokIcon className="w-5 h-5 text-secondary" />
                    TikTok
                  </a>
                )}
                {telegramUrl && (
                  <a
                    href={telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-warm bg-surface-2 hover:shadow-md transition-shadow text-sm font-medium text-secondary"
                  >
                    <TelegramIcon className="w-5 h-5 text-[#26A5E4]" />
                    Telegram
                  </a>
                )}
                {youtubeUrl && (
                  <a
                    href={youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-warm bg-surface-2 hover:shadow-md transition-shadow text-sm font-medium text-secondary"
                  >
                    <YoutubeIcon className="w-5 h-5 text-[#FF0000]" />
                    YouTube
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
