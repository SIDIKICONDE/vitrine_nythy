'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import {  useSearchParams } from 'next/navigation';

/**
 * Page de connexion admin
 */
export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('🔐 [Admin Login] Tentative de connexion...');
      
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        console.log('❌ [Admin Login] Erreur:', result.error);
        setError('Email ou mot de passe incorrect');
        setIsLoading(false);
        return;
      }

      console.log('✅ [Admin Login] Connexion réussie');

      // Vérifier que l'utilisateur est admin avant de rediriger
      try {
        const checkResponse = await fetch('/api/admin/check-role');
        const checkData = await checkResponse.json();

        if (!checkData.isAdmin) {
          console.log('❌ [Admin Login] Pas de rôle admin');
          setError('Vous devez être administrateur pour accéder à cette page');
          setIsLoading(false);
          return;
        }

        console.log('✅ [Admin Login] Rôle admin vérifié, redirection...');
        
        // Attendre un peu pour que la session soit complètement établie
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Rediriger vers le dashboard
        window.location.href = callbackUrl;
      } catch (err) {
        console.error('❌ [Admin Login] Erreur vérification rôle:', err);
        setError('Erreur lors de la vérification des permissions');
        setIsLoading(false);
      }
    } catch (err) {
      console.error('❌ [Admin Login] Erreur:', err);
      setError('Une erreur est survenue. Veuillez réessayer.');
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo et titre */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tighter text-primary">NYTHY ADMIN</h1>
          <p className="mt-2 text-sm text-foreground-muted">
            Connectez-vous pour accéder au dashboard
          </p>
        </div>

        {/* Formulaire de connexion */}
        <div className="rounded-2xl border border-border bg-surface-elevated p-8 shadow-custom-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="admin@nythy.com"
                disabled={isLoading}
              />
            </div>

            {/* Mot de passe */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                id="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-custom-md transition-all hover:bg-primary-hover hover:shadow-custom-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Connexion en cours...
                </span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Informations de test */}
          <div className="mt-6 rounded-lg bg-info/10 border border-info/20 px-4 py-3">
            <p className="text-xs font-semibold text-info mb-2">Identifiants de test :</p>
            <p className="text-xs text-foreground-muted">
              Email: <code className="font-mono">admin@nythy.com</code>
            </p>
            <p className="text-xs text-foreground-muted">
              Mot de passe: <code className="font-mono">admin123</code>
            </p>
          </div>
        </div>

        {/* Lien retour */}
        <div className="text-center">
          <a
            href="/"
            className="text-sm text-foreground-muted hover:text-primary transition-colors"
          >
            ← Retour au site
          </a>
        </div>
      </div>
    </div>
  );
}

