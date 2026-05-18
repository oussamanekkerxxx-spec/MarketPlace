import { getTranslations } from 'next-intl/server';
import { PackageX } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/ErrorLayout';

export default async function ProductNotFoundPage() {
  const t = await getTranslations('errors');

  return (
    <ErrorLayout
      code="404"
      icon={PackageX}
      title={t('productNotFound.title')}
      body={t('productNotFound.body')}
      actions={[
        { type: 'link', href: '/category/all', label: t('actions.browse') },
        { type: 'link', href: '/', label: t('actions.home'), variant: 'secondary' },
      ]}
    />
  );
}
