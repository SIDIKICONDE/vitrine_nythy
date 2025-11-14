'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ErrorLog } from '@/types/admin';
import { AlertCircle, AlertTriangle, XCircle } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';

/**
 * Page de monitoring des erreurs
 */
export default function AdminErrorsPage(): ReactElement {
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');

  useEffect(() => {
    loadErrors();
  }, []);

  const loadErrors = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/errors');
      const data = await response.json();
      setErrors(data.errors || []);
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredErrors = errors.filter(error => 
    filterLevel === 'all' || error.level === filterLevel
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Monitoring des Erreurs
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {errors.length} erreurs enregistrées
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-2">
            {['all', 'critical', 'error', 'warning'].map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${filterLevel === level 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }
                `}
              >
                {level === 'all' && 'Toutes'}
                {level === 'critical' && 'Critiques'}
                {level === 'error' && 'Erreurs'}
                {level === 'warning' && 'Warnings'}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des erreurs */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredErrors.map((error) => {
              const Icon = 
                error.level === 'critical' ? XCircle :
                error.level === 'error' ? AlertCircle :
                AlertTriangle;

              const colorClasses = 
                error.level === 'critical' ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 border-red-300 dark:border-red-700' :
                error.level === 'error' ? 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 border-orange-300 dark:border-orange-700' :
                'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';

              return (
                <div
                  key={error.id}
                  className={`rounded-xl border-2 p-6 ${colorClasses}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-white/50 dark:bg-black/20">
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold mb-1">
                            {error.message}
                          </h3>
                          <div className="text-sm opacity-80">
                            {error.method} {error.path}
                            {error.statusCode && ` • Status: ${error.statusCode}`}
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/50 dark:bg-black/20">
                          {error.level.toUpperCase()}
                        </span>
                      </div>

                      {error.stack && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-medium mb-2">
                            Stack trace
                          </summary>
                          <pre className="text-xs bg-white/30 dark:bg-black/30 p-3 rounded overflow-x-auto">
                            {error.stack}
                          </pre>
                        </details>
                      )}

                      <div className="mt-3 text-sm opacity-80">
                        {new Date(error.timestamp).toLocaleString('fr-FR')}
                        {error.userId && ` • User: ${error.userId}`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredErrors.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Aucune erreur à afficher
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

