'use client';

import { useState } from 'react';
import { Link } from '@/lib/i18n/navigation';
import Image from 'next/image';
import { ChevronDown, Phone, Mail, MapPin, ArrowUp, ShieldCheck } from 'lucide-react';

interface Category {
  id: string;
  slug: string;
  name_fr: string;
  [key: string]: unknown;
}

interface MobileFooterProps {
  locale: string;
  siteName: string;
  siteTagline?: string;
  logoUrl: string | null;
  footerDescription: string;
  categories: Category[];
  contactPhone?: string;
  contactEmail?: string;
  whatsappNumber?: string;
  contactAddress?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  telegramUrl?: string;
  youtubeUrl?: string;
  shopLabel: string;
  helpLabel: string;
  rightsLabel: string;
  productsLabel: string;
  aboutLabel: string;
  contactLabel: string;
}

export function MobileFooter({
  locale,
  siteName,
  siteTagline,
  logoUrl,
  footerDescription,
  categories,
  contactPhone,
  contactEmail,
  whatsappNumber,
  contactAddress,
  facebookUrl,
  instagramUrl,
  tiktokUrl,
  telegramUrl,
  youtubeUrl,
  shopLabel,
  helpLabel,
  rightsLabel,
  productsLabel,
  aboutLabel,
  contactLabel,
}: MobileFooterProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const toggle = (id: string) => setOpenSection((cur) => (cur === id ? null : id));

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryName = (cat: Category): string =>
    (cat[`name_${locale}`] as string | undefined) || cat.name_fr;

  const privacyLabel =
    locale === 'fr' ? 'Confidentialité' : locale === 'en' ? 'Privacy' : 'الخصوصية';
  const termsLabel = locale === 'fr' ? 'CGV' : locale === 'en' ? 'Terms' : 'الشروط';

  return (
    <footer
      className="md:hidden"
      style={{ backgroundColor: '#FBF9F7', borderTop: '1px solid #E5E1DC' }}
    >
      {/* Brand block */}
      <div className="px-5 pt-8 pb-5">
        <div className="flex items-center gap-2.5 mb-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={siteName}
              width={120}
              height={36}
              className="rounded-lg object-contain"
              style={{ width: 'auto', height: '36px' }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {siteName.charAt(0)}
            </div>
          )}
          <span className="text-xl font-bold tracking-tight" style={{ color: '#0c0818' }}>
            {siteTagline ? `(${siteTagline}) ${siteName}` : siteName}
          </span>
        </div>

        <p className="text-sm leading-relaxed mb-4" style={{ color: '#6B7280' }}>
          {footerDescription}
        </p>

        {/* Social icons */}
        {(facebookUrl || instagramUrl || tiktokUrl || telegramUrl || youtubeUrl) && (
          <div className="flex items-center gap-2 flex-wrap">
            {facebookUrl && <SocialBtn href={facebookUrl} label="Facebook" Icon={FacebookIcon} />}
            {instagramUrl && <SocialBtn href={instagramUrl} label="Instagram" Icon={InstagramIcon} />}
            {tiktokUrl && <SocialBtn href={tiktokUrl} label="TikTok" Icon={TiktokIcon} />}
            {telegramUrl && <SocialBtn href={telegramUrl} label="Telegram" Icon={TelegramIcon} />}
            {youtubeUrl && <SocialBtn href={youtubeUrl} label="YouTube" Icon={YoutubeIcon} />}
          </div>
        )}
      </div>

      {/* Trust badges */}
      <div
        className="mx-5 mb-5 rounded-xl p-3 flex items-center gap-2.5"
        style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E1DC' }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(255,107,53,0.1)' }}
        >
          <ShieldCheck className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight" style={{ color: '#0c0818' }}>
            Paiement à la livraison
          </p>
          <p className="text-[11px] leading-tight mt-0.5" style={{ color: '#6B7280' }}>
            Inspectez avant de payer
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold"
            style={{
              backgroundColor: 'rgba(255,107,53,0.1)',
              color: 'var(--color-primary)',
            }}
          >
            COD
          </span>
        </div>
      </div>

      {/* Accordion sections */}
      <div className="px-5">
        <AccordionSection
          id="shop"
          title={shopLabel}
          open={openSection === 'shop'}
          onToggle={() => toggle('shop')}
        >
          <Link
            href="/category/all"
            className="block py-2.5 text-sm font-medium border-b"
            style={{ color: '#0c0818', borderColor: 'rgba(0,0,0,0.04)' }}
          >
            {productsLabel}
          </Link>
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}` as '/category/[slug]'}
              className="block py-2.5 text-sm border-b last:border-0"
              style={{ color: '#6B7280', borderColor: 'rgba(0,0,0,0.04)' }}
            >
              {categoryName(cat)}
            </Link>
          ))}
        </AccordionSection>

        <AccordionSection
          id="help"
          title={helpLabel}
          open={openSection === 'help'}
          onToggle={() => toggle('help')}
        >
          <Link
            href="/about"
            className="block py-2.5 text-sm border-b"
            style={{ color: '#0c0818', borderColor: 'rgba(0,0,0,0.04)' }}
          >
            {aboutLabel}
          </Link>
          <Link
            href="/contact"
            className="block py-2.5 text-sm border-b"
            style={{ color: '#0c0818', borderColor: 'rgba(0,0,0,0.04)' }}
          >
            {contactLabel}
          </Link>
          <Link
            href="/privacy"
            className="block py-2.5 text-sm border-b"
            style={{ color: '#0c0818', borderColor: 'rgba(0,0,0,0.04)' }}
          >
            {privacyLabel}
          </Link>
          <Link
            href="/terms"
            className="block py-2.5 text-sm"
            style={{ color: '#0c0818' }}
          >
            {termsLabel}
          </Link>
        </AccordionSection>
      </div>

      {/* Contact card — always visible */}
      <div className="px-5 mt-5">
        <p
          className="text-[11px] font-semibold uppercase tracking-wider mb-3"
          style={{ color: '#9CA3AF' }}
        >
          {contactLabel}
        </p>
        <div className="space-y-2">
          {contactPhone && (
            <a
              href={`tel:${contactPhone}`}
              className="flex items-center gap-3 p-3 rounded-xl active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E1DC' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(255,107,53,0.1)' }}
              >
                <Phone className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-tight" style={{ color: '#6B7280' }}>
                  Téléphone
                </p>
                <p className="text-sm font-semibold leading-tight mt-0.5" style={{ color: '#0c0818' }}>
                  {contactPhone}
                </p>
              </div>
            </a>
          )}

          {whatsappNumber && (
            <a
              href={`https://wa.me/${whatsappNumber.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E1DC' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(34,197,94,0.12)' }}
              >
                <svg className="w-4 h-4" fill="#22C55E" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-tight" style={{ color: '#6B7280' }}>
                  WhatsApp
                </p>
                <p className="text-sm font-semibold leading-tight mt-0.5" style={{ color: '#0c0818' }}>
                  Discuter maintenant
                </p>
              </div>
            </a>
          )}

          {contactEmail && (
            <a
              href={`mailto:${contactEmail}`}
              className="flex items-center gap-3 p-3 rounded-xl active:scale-[0.98] transition-transform"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E1DC' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(255,107,53,0.1)' }}
              >
                <Mail className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-tight" style={{ color: '#6B7280' }}>
                  Email
                </p>
                <p className="text-sm font-semibold leading-tight mt-0.5" style={{ color: '#0c0818' }}>
                  {contactEmail}
                </p>
              </div>
            </a>
          )}

          {contactAddress && (
            <div
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E1DC' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'rgba(107,114,128,0.12)' }}
              >
                <MapPin className="w-4 h-4" style={{ color: '#6B7280' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] leading-tight" style={{ color: '#6B7280' }}>
                  Adresse
                </p>
                <p className="text-sm font-semibold leading-tight mt-0.5" style={{ color: '#0c0818' }}>
                  {contactAddress}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="mt-6 px-5 py-5 flex flex-col items-center gap-3"
        style={{ borderTop: '1px solid #E5E1DC' }}
      >
        <button
          type="button"
          onClick={scrollTop}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold active:scale-95 transition-transform"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E1DC',
            color: '#0c0818',
          }}
        >
          <ArrowUp className="w-3.5 h-3.5" />
          Haut de page
        </button>

        <p className="text-[11px] text-center" style={{ color: '#9CA3AF' }}>
          © {new Date().getFullYear()} {siteName}. {rightsLabel}
        </p>
      </div>
    </footer>
  );
}

function AccordionSection({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: '1px solid #E5E1DC' }}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 active:opacity-70 transition-opacity"
        aria-expanded={open}
        aria-controls={`section-${id}`}
      >
        <span className="text-sm font-semibold" style={{ color: '#0c0818' }}>
          {title}
        </span>
        <ChevronDown
          className="w-4 h-4 transition-transform duration-200"
          style={{
            color: '#6B7280',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>
      <div
        id={`section-${id}`}
        className="overflow-hidden transition-[max-height] duration-300 ease-out"
        style={{ maxHeight: open ? '500px' : '0px' }}
      >
        <div className="pb-2">{children}</div>
      </div>
    </div>
  );
}

function SocialBtn({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E1DC',
        color: '#0c0818',
      }}
    >
      <Icon className="w-4 h-4" />
    </a>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.737 13.647l-2.963-.924c-.644-.204-.657-.644.136-.953l11.57-4.461c.537-.194 1.006.131.834.912h-.42z" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
    </svg>
  );
}
