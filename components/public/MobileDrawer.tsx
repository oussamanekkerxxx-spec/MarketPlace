'use client';

import { useMemo, useState } from 'react';
import { Link } from '@/lib/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X, Home, ShoppingBag, Mail, HelpCircle, FileText, Shield, User } from 'lucide-react';
import { getWhatsAppHref } from '@/lib/utils/contact';

interface Category {
  id: string;
  slug: string;
  name_fr: string;
  name_en?: string;
  name_ar?: string;
}

interface MobileDrawerProps {
  locale: string;
  categories: Category[];
  siteName: string;
  siteTagline?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
  contactEmail?: string;
}

export function MobileDrawer({
  locale,
  categories,
  siteName,
  siteTagline,
  whatsappNumber,
  whatsappMessage,
  contactEmail,
}: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isRtl = locale === 'ar';
  const t = useTranslations('navigation');
  const tf = useTranslations('footer');

  const close = () => setIsOpen(false);

  const categoryName = (cat: Category) =>
    (cat[`name_${locale}` as keyof Category] as string | undefined) || cat.name_fr;

  // Safe translation that falls back to a default if the key throws
  const safeT = (translator: (k: string) => string, key: string, fallback: string) => {
    try {
      const v = translator(key);
      return v && v !== key ? v : fallback;
    } catch {
      return fallback;
    }
  };

  const labels = {
    shop: safeT(tf, 'shop', locale === 'ar' ? 'تسوق' : locale === 'fr' ? 'Boutique' : 'Shop'),
    help: safeT(tf, 'help', locale === 'ar' ? 'المساعدة' : locale === 'fr' ? 'Aide' : 'Help'),
    home: safeT(t, 'home', locale === 'ar' ? 'الرئيسية' : locale === 'fr' ? 'Accueil' : 'Home'),
    about: safeT(t, 'about', locale === 'ar' ? 'من نحن' : locale === 'fr' ? 'À propos' : 'About'),
    contact: safeT(t, 'contact', locale === 'ar' ? 'اتصل بنا' : locale === 'fr' ? 'Contact' : 'Contact'),
    allProducts: locale === 'fr' ? 'Tous les produits' : locale === 'en' ? 'All products' : 'جميع المنتجات',
    privacy: locale === 'fr' ? 'Confidentialité' : locale === 'en' ? 'Privacy' : 'الخصوصية',
    terms: locale === 'fr' ? 'CGV' : locale === 'en' ? 'Terms' : 'الشروط',
  };

  const whatsappHref = useMemo(() => {
    return getWhatsAppHref(whatsappNumber, whatsappMessage);
  }, [whatsappNumber, whatsappMessage]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-text hover:bg-surface-2 rounded-lg transition-colors"
        aria-label={locale === 'fr' ? 'Menu' : locale === 'en' ? 'Menu' : 'القائمة'}
      >
        <Menu className="w-6 h-6" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[200]"
          style={{ height: '100dvh' }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={close}
          />

          {/* Drawer */}
          <div
            className={`absolute top-0 w-[320px] max-w-[85vw] bg-surface shadow-2xl overflow-y-auto flex flex-col ${
              isRtl ? 'left-0' : 'right-0'
            }`}
            style={{ height: '100dvh', backgroundColor: '#FFFFFF' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-warm">
              <div className="flex flex-col">
                <span className="text-lg font-bold text-secondary">{siteName}</span>
                {siteTagline && (
                  <span className="text-xs mt-0.5" style={{ color: 'var(--color-primary)' }}>{siteTagline}</span>
                )}
              </div>
              <button
                onClick={close}
                className="p-2 text-text-muted hover:bg-surface-2 rounded-lg transition-colors"
                aria-label={locale === 'fr' ? 'Fermer' : locale === 'en' ? 'Close' : 'إغلاق'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-6 flex-1" style={{ color: '#0c0818' }}>
              {/* Shop */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>
                  {labels.shop}
                </h3>
                <div className="space-y-1">
                  <DrawerLink href="/" icon={Home} label={labels.home} onClick={close} />
                  <DrawerLink
                    href="/category/all"
                    icon={ShoppingBag}
                    label={labels.allProducts}
                    onClick={close}
                  />
                  {categories.slice(0, 8).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/category/${cat.slug}` as '/category/[slug]'}
                      onClick={close}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
                      style={{ color: '#0c0818' }}
                    >
                      <ShoppingBag className="w-4 h-4 shrink-0" style={{ color: '#6B7280' }} />
                      {categoryName(cat)}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Help */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>
                  {labels.help}
                </h3>
                <div className="space-y-1">
                  <DrawerLink href="/about" icon={User} label={labels.about} onClick={close} />
                  <DrawerLink href="/contact" icon={Mail} label={labels.contact} onClick={close} />
                  <DrawerLink
                    href="/privacy"
                    icon={Shield}
                    label={labels.privacy}
                    onClick={close}
                  />
                  <DrawerLink
                    href="/terms"
                    icon={FileText}
                    label={labels.terms}
                    onClick={close}
                  />
                </div>
              </div>

              {/* Contact */}
              {(whatsappHref || contactEmail) && (
                <div>
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
                    {t('contact')}
                  </h3>
                  <div className="space-y-3 text-sm">
                    {whatsappHref && (
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-text hover:text-primary transition-colors"
                      >
                        <HelpCircle className="w-4 h-4 text-green-500" />
                        WhatsApp
                      </a>
                    )}
                    {contactEmail && (
                      <a
                        href={`mailto:${contactEmail}`}
                        className="flex items-center gap-2 text-text hover:text-primary transition-colors"
                      >
                        <Mail className="w-4 h-4 text-primary" />
                        {contactEmail}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function DrawerLink({
  href,
  icon: Icon,
  label,
  onClick,
}: {
  href: React.ComponentProps<typeof Link>['href'];
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
      style={{ color: '#0c0818' }}
    >
      <Icon className="w-4 h-4" style={{ color: '#6B7280' }} />
      {label}
    </Link>
  );
}
