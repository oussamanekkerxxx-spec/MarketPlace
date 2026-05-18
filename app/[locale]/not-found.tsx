import { getTranslations } from 'next-intl/server';
import { Compass } from 'lucide-react';
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
    title: `404 — ${t('404.title')}`,
  };
}

export default async function LocaleNotFoundPage() {
  const t = await getTranslations('errors');

  return (
    <ErrorLayout
      code="404"
      icon={Compass}
      title={t('404.title')}
      body={t('404.body')}
      actions={[
        { type: 'link', href: '/', label: t('actions.home') },
        { type: 'link', href: '/category/all', label: t('actions.browse'), variant: 'secondary' },
      ]}
    />
  );
}
