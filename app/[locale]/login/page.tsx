import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import LoginForm from './LoginForm';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'login' });

  return {
    title: t('title'),
    robots: { index: false, follow: false },
  };
}

export default function LoginPage() {
  return <LoginForm />;
}
