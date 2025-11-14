'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { CacheMetrics } from '@/types/admin';
import { BarChart3, Database, RefreshCw, TrendingUp } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';

/**
 * Page de monitoring du cache
 */
export default function AdminCachePage(): ReactElement {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/cache/metrics');
      const data = await response.json();
      setMetrics(data.metrics);
    } catch (error) {
      console.error('Erreur chargement cache:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Êtes-vous sûr de vouloir vider tout le cache ?')) {
      return;
    }

    try {
      await fetch('/api/admin/cache/clear', { method: 'POST' });
      await loadMetrics();
      alert('Cache vidé avec succès');
    } catch (error) {
      console.error('Erreur vidage cache:', error);
      alert('Erreur lors du vidage du cache');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!metrics) {
    return (
      <AdminLayout>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Aucune métrique disponible
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Monitoring du Cache
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Performance et utilisation de la mémoire
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadMetrics}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Actualiser
            </button>
            <button
              onClick={handleClearCache}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Database className="w-5 h-5" />
              Vider le cache
            </button>
          </div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8" />
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {metrics.totalKeys}
            </div>
            <div className="text-sm text-white/80">Clés en cache</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {(metrics.hitRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-white/80">Taux de succès</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {(metrics.memoryUsage / 1024 / 1024).toFixed(2)} MB
            </div>
            <div className="text-sm text-white/80">Mémoire utilisée</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div className="text-3xl font-bold mb-1">
              {metrics.evictionCount}
            </div>
            <div className="text-sm text-white/80">Évictions</div>
          </div>
        </div>

        {/* Top clés */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Clés les plus utilisées
          </h2>
          <div className="space-y-3">
            {metrics.topKeys.map((key, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {key.key}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Taille: {(key.size / 1024).toFixed(2)} KB
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-600">
                    {key.hits}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    hits
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

