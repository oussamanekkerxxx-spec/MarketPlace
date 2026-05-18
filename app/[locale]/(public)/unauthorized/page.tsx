import { getTranslations } from 'next-intl/server';
import { LogIn } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/ErrorLayout';
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'errors' });
  return {
    title: `401 — ${t('401.title')}`,
    robots: { index: false, follow: false },
  };
}

export default async function UnauthorizedPage() {
  const t = await getTranslations('errors');

  return (
    <ErrorLayout
      code="401"
      icon={LogIn}
      title={t('401.title')}
      body={t('401.body')}
      actions={[
        { type: 'link', href: '/login', label: t('actions.login') },
        { type: 'link', href: '/', label: t('actions.home'), variant: 'secondary' },
      ]}
    />
  );
}
