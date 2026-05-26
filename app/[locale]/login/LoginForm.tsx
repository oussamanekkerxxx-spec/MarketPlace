'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/lib/i18n/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'fr';
  const t = useTranslations('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Login error:', error);
      setError(error.message || t('error.invalidCredentials'));
      setLoading(false);
      return;
    }

    setLoading(false);
    // Use full page navigation so the server picks up the auth cookie cleanly
    window.location.href = `/${locale}/admin`;
  };

  const handleReset = async () => {
    if (!email) {
      setError(t('error.enterEmail'));
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/${locale}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-2">
      <div className="w-full max-w-md p-8 bg-surface rounded-2xl border border-border-warm shadow-lg">
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-4"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            A
          </div>
          <h1 className="text-2xl font-bold text-secondary">{t('title')}</h1>
          <p className="text-sm text-text-muted mt-1">{t('subtitle')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {resetSent && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            {t('resetSent')}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-border-warm rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-surface transition-colors"
              placeholder={t('emailPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-border-warm rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-surface transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? t('submitting') : t('submit')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleReset}
            className="text-sm text-text-muted hover:text-primary transition-colors"
          >
            {t('forgotPassword')}
          </button>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-text-muted hover:text-primary transition-colors"
          >
            {t('backToSite')}
          </Link>
        </div>
      </div>
    </div>
  );
}
