import { getTranslations } from 'next-intl/server';
import { Hourglass } from 'lucide-react';
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
    title: `429 — ${t('429.title')}`,
    robots: { index: false, follow: false },
  };
}

export default async function RateLimitedPage() {
  const t = await getTranslations('errors');

  return (
    <ErrorLayout
      code="429"
      icon={Hourglass}
      title={t('429.title')}
      body={t('429.body')}
      actions={[{ type: 'link', href: '/', label: t('actions.home') }]}
    />
  );
}
