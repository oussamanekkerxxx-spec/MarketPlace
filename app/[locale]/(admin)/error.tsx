'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert } from 'lucide-react';
import { ErrorLayout } from '@/components/errors/ErrorLayout';

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  useEffect(() => {
    // Server-side this would call logError(); on the client we can only print.
    // The Next.js `digest` already correlates to the server log entry.
    // eslint-disable-next-line no-console
    console.error('[admin-error]', { digest: error.digest });
  }, [error]);

  return (
    <ErrorLayout
      variant="admin"
      code="500"
      icon={ShieldAlert}
      title={t('admin.title')}
      body={t('admin.body')}
      refId={error.digest}
      refLabel={t('ref')}
      actions={[
        { type: 'button', onClick: reset, label: t('actions.retry') },
        { type: 'link', href: '/admin', label: t('actions.dashboard'), variant: 'secondary' },
      ]}
    />
  );
}
