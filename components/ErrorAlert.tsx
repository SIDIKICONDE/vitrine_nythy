'use client';

import { AlertTriangle, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Composant pour afficher les messages d'erreur depuis les query params
 * Utilisé notamment pour les erreurs d'accès admin
 */
export function ErrorAlert() {
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');

    if (errorParam) {
      setError(errorParam);
      setMessage(messageParam);
      setVisible(true);

      // Auto-hide après 10 secondes
      const timer = setTimeout(() => {
        setVisible(false);
      }, 10000);

      return () => clearTimeout(timer);
    }
    
    return undefined;
  }, [searchParams]);

  if (!visible || !error) {
    return null;
  }

  const errorMessages: Record<string, string> = {
    access_denied: 'Accès refusé',
    unauthorized: 'Non autorisé',
    session_expired: 'Session expirée',
  };

  const title = errorMessages[error] || 'Erreur';
  const description =
    message ||
    'Vous n\'avez pas les permissions nécessaires pour accéder à cette ressource.';

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-5">
      <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-900 dark:text-red-100 mb-1">
              {title}
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300">{description}</p>
          </div>

          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-5 h-5 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

