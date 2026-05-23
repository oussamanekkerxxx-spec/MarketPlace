'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/ErrorLayout';

export default function ProductErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[product-error]', {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  return (
    <ErrorLayout
      code="500"
      icon={AlertTriangle}
      title={t('500.title')}
      body={t('500.body')}
      refId={error.digest}
      refLabel={t('ref')}
      actions={[
        { type: 'button', onClick: reset, label: t('actions.retry') },
        { type: 'link', href: '/', label: t('actions.home'), variant: 'secondary' },
      ]}
    />
  );
}
