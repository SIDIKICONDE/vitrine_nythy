/**
 * MerchantLoginForm - Formulaire de connexion marchand
 */

'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import TwoFactorLoginModal from '@/components/TwoFactorLoginModal';

export default function MerchantLoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);

  const getCsrfToken = () =>
    document.cookie
      .split('; ')
      .find(row => row.startsWith('nythy_csrf_token='))
      ?.split('=')[1] ?? '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('🔐 [LOGIN] Tentative de connexion avec:', formData.email);
      const csrfToken = getCsrfToken();
      console.log('🔐 [LOGIN] CSRF Token:', csrfToken ? '✅' : '❌');

      const callbackUrl = `${window.location.origin}/merchant/dashboard`;

      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
        csrfToken,
      });

      if (result?.error) {
        console.error('❌ [LOGIN] Erreur:', result.error);
        if (result.error === '2FA_REQUIRED') {
          setPendingCredentials({ email: formData.email, password: formData.password });
          setShowTwoFactorModal(true);
          return;
        }

        throw new Error('Email ou mot de passe incorrect');
      }

      console.log('✅ [LOGIN] Connexion réussie!');
      router.push('/merchant/dashboard');
      router.refresh();
    } catch (err) {
      console.error('❌ [LOGIN] Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorVerify = async (code: string, useRecoveryCode: boolean) => {
    if (!pendingCredentials) {
      throw new Error('Informations de connexion manquantes');
    }

    const csrfToken = getCsrfToken();
    const callbackUrl = `${window.location.origin}/merchant/dashboard`;

    const result = await signIn('credentials', {
      email: pendingCredentials.email,
      password: pendingCredentials.password,
      twoFactorCode: code,
      twoFactorUseRecovery: useRecoveryCode,
      redirect: false,
      callbackUrl,
      csrfToken,
    });

    if (result?.error) {
      throw new Error(result.error || 'Code invalide');
    }

    setShowTwoFactorModal(false);
    setPendingCredentials(null);
    router.push('/merchant/dashboard');
    router.refresh();
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="votre@email.com"
          className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>

      {/* Mot de passe */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            Mot de passe
          </label>
          <Link
            href="/merchant/forgot-password"
            className="text-sm text-primary hover:text-secondary transition-colors"
          >
            Mot de passe oublié ?
          </Link>
        </div>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="••••••••"
          className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        />
      </div>

      {/* Se souvenir de moi */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="remember"
          className="w-4 h-4 text-primary focus:ring-primary border-border rounded"
        />
        <label htmlFor="remember" className="ml-2 block text-sm text-foreground-muted">
          Se souvenir de moi
        </label>
      </div>

      {/* Bouton de connexion */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Connexion en cours...
          </span>
        ) : (
          'Se connecter'
        )}
      </button>

      {/* Lien vers inscription */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-foreground-muted">
          Pas encore de compte ?{' '}
          <Link
            href="/merchant/register"
            className="font-semibold text-primary hover:text-secondary transition-colors"
          >
            Créer un compte
          </Link>
        </p>
      </div>
      </form>

      {showTwoFactorModal && pendingCredentials && (
        <TwoFactorLoginModal
          email={pendingCredentials.email}
          onVerify={handleTwoFactorVerify}
          onCancel={() => {
            setShowTwoFactorModal(false);
            setPendingCredentials(null);
          }}
        />
      )}
    </>
  );
}

