'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Database, HardDrive, RefreshCw, Trash2 } from 'lucide-react';
import { ReactElement, useState } from 'react';

/**
 * Page d'outils de maintenance
 */
export default function AdminMaintenancePage(): ReactElement {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const runMaintenance = async (action: string) => {
    setIsRunning(true);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/maintenance/${action}`, {
        method: 'POST',
      });
      const data = await response.json();
      setResult(`✅ ${data.message || 'Terminé avec succès'}`);
    } catch (error) {
      setResult(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsRunning(false);
    }
  };

  const maintenanceTasks = [
    {
      id: 'clean-cache',
      title: 'Nettoyer le cache',
      description: 'Supprime tous les éléments du cache pour libérer de la mémoire',
      icon: Trash2,
      color: 'from-red-500 to-pink-600',
      action: 'clean-cache',
    },
    {
      id: 'optimize-db',
      title: 'Optimiser la base de données',
      description: 'Optimise les index et nettoie les données obsolètes',
      icon: Database,
      color: 'from-blue-500 to-cyan-600',
      action: 'optimize-db',
    },
    {
      id: 'clean-temp',
      title: 'Nettoyer fichiers temporaires',
      description: 'Supprime les fichiers temporaires et orphelins',
      icon: HardDrive,
      color: 'from-purple-500 to-indigo-600',
      action: 'clean-temp',
    },
    {
      id: 'sync-data',
      title: 'Synchroniser les données',
      description: 'Recalcule les statistiques et met à jour les compteurs',
      icon: RefreshCw,
      color: 'from-green-500 to-teal-600',
      action: 'sync-data',
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Outils de Maintenance
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Gérez et optimisez la plateforme
          </p>
        </div>

        {/* Résultat */}
        {result && (
          <div
            className={`
              p-4 rounded-xl border-2
              ${result.startsWith('✅') 
                ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' 
                : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
              }
            `}
          >
            {result}
          </div>
        )}

        {/* Tâches de maintenance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {maintenanceTasks.map((task) => {
            const Icon = task.icon;
            return (
              <div
                key={task.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${task.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {task.description}
                    </p>

                    <button
                      onClick={() => runMaintenance(task.action)}
                      disabled={isRunning}
                      className={`
                        w-full px-4 py-2 rounded-lg font-medium transition-colors
                        ${isRunning 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                          : 'bg-amber-600 text-white hover:bg-amber-700'
                        }
                      `}
                    >
                      {isRunning ? 'En cours...' : 'Exécuter'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="text-2xl">⚠️</div>
            <div>
              <h3 className="font-bold text-yellow-800 dark:text-yellow-300 mb-1">
                Attention
              </h3>
              <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                Les opérations de maintenance peuvent impacter temporairement les performances de la plateforme.
                Il est recommandé de les exécuter pendant les heures creuses.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

