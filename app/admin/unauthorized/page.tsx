'use client';

import { AlertTriangle, Home, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

/**
 * Page d'accès refusé admin
 */
function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Icône d'erreur */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Accès refusé
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vous devez être administrateur pour accéder à cette page
          </p>
        </div>

        {/* Carte d'information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Pourquoi ce message ?
          </h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Vous n'avez pas les droits d'administrateur</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Cette zone est réservée aux administrateurs Nythy</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500 mt-0.5">•</span>
              <span>Contactez un administrateur pour obtenir l'accès</span>
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-md"
          >
            <Home className="w-5 h-5" />
            Retour à l'accueil
          </Link>

          <Link
            href={`/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            <LogIn className="w-5 h-5" />
            Se connecter avec un compte admin
          </Link>
        </div>

        {/* Info de contact */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Besoin d'aide ?{' '}
            <a
              href="mailto:support@nythy.com"
              className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 font-medium"
            >
              Contactez le support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-amber-600 border-t-transparent" />
          </div>
        </div>
      }
    >
      <UnauthorizedContent />
    </Suspense>
  );
}

