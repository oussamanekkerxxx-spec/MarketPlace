import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/lib/i18n/routing';
import { Inter, Tajawal } from 'next/font/google';
import { getSiteSettings } from '@/lib/cache/queries';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const tajawal = Tajawal({ subsets: ['arabic'], weight: ['400', '500', '700'], display: 'swap' });

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as 'fr' | 'en' | 'ar')) {
    notFound();
  }

  const messages = await getMessages();
  const isRTL = locale === 'ar';

  const settings = await getSiteSettings();
  const primaryColor = (settings?.primary_color as string) || '#FF6B35';
  const secondaryColor = (settings?.secondary_color as string) || '#0c0818';
  const accentColor = (settings?.accent_color as string) || '#F7931E';
  return (
    <html
      lang={locale}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-scroll-behavior="smooth"
      style={{
        ['--color-primary' as string]: primaryColor,
        ['--color-secondary' as string]: secondaryColor,
        ['--color-accent' as string]: accentColor,
      }}
    >
      <body className={`antialiased bg-white text-gray-900 ${locale === 'ar' ? tajawal.className : inter.className}`}>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
