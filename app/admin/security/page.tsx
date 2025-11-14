'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Lock, Shield } from 'lucide-react';
import { ReactElement } from 'react';

/**
 * Page de paramètres de sécurité
 */
export default function AdminSecurityPage(): ReactElement {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Paramètres de Sécurité
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configurez les paramètres de sécurité de la plateforme
          </p>
        </div>

        {/* Sections de sécurité */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-linear-to-br from-amber-500 to-orange-600">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Authentification
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Gérez les paramètres d'authentification et de connexion
            </p>
            <button className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
              Configurer
            </button>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-pink-600">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Pare-feu
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Configurez les règles de pare-feu et filtrage IP
            </p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              Configurer
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

