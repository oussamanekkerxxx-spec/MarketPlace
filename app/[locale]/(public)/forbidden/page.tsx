import { getTranslations } from 'next-intl/server';
import { ShieldOff } from 'lucide-react';
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
    title: `403 — ${t('403.title')}`,
    robots: { index: false, follow: false },
  };
}

export default async function ForbiddenPage() {
  const t = await getTranslations('errors');

  return (
    <ErrorLayout
      code="403"
      icon={ShieldOff}
      title={t('403.title')}
      body={t('403.body')}
      actions={[
        { type: 'link', href: '/', label: t('actions.home') },
        { type: 'link', href: '/login', label: t('actions.login'), variant: 'secondary' },
      ]}
    />
  );
}
