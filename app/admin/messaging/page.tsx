'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { MessageSquare } from 'lucide-react';
import { ReactElement } from 'react';

/**
 * Page de métriques de messagerie
 */
export default function AdminMessagingPage(): ReactElement {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-10 h-10 text-amber-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Métriques de Messagerie
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Fonctionnalité à venir
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

