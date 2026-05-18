'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/lib/i18n/navigation';

function ResetPasswordFormInner() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    const supabase = createClient();

    // If we have a code from the magic link, exchange it first
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setError('Le lien de réinitialisation est invalide ou a expiré');
        setLoading(false);
        return;
      }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-2">
      <div className="w-full max-w-md p-8 bg-surface rounded-2xl border border-border-warm shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-secondary">Nouveau mot de passe</h1>
          <p className="text-sm text-text-muted mt-1">
            Choisissez un nouveau mot de passe pour votre compte
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
            Mot de passe mis à jour ! Redirection...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2.5 border border-border-warm rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-surface transition-colors"
              placeholder="••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-border-warm rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none bg-surface transition-colors"
              placeholder="••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {loading ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-text-muted hover:text-primary transition-colors">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordForm() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-2">
        <div className="w-full max-w-md p-8 bg-surface rounded-2xl border border-border-warm shadow-lg text-center">
          <p className="text-text-muted">Chargement...</p>
        </div>
      </div>
    }>
      <ResetPasswordFormInner />
    </Suspense>
  );
}
