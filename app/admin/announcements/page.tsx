'use client';

import { ReactElement, useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Announcement } from '@/types/admin';
import { Megaphone, Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

/**
 * Page de gestion des annonces
 */
export default function AdminAnnouncementsPage(): ReactElement {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/announcements');
      const data = await response.json();
      setAnnouncements(data.announcements || []);
    } catch (error) {
      console.error('Erreur chargement annonces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (announcementId: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/announcements/${announcementId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });
      await loadAnnouncements();
    } catch (error) {
      console.error('Erreur toggle annonce:', error);
    }
  };

  const handleDelete = async (announcementId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) {
      return;
    }

    try {
      await fetch(`/api/admin/announcements/${announcementId}`, {
        method: 'DELETE',
      });
      await loadAnnouncements();
    } catch (error) {
      console.error('Erreur suppression annonce:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des Annonces
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {announcements.length} annonces au total
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nouvelle annonce
          </button>
        </div>

        {/* Liste des annonces */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className={`
                  bg-white dark:bg-gray-800 rounded-xl border-2 p-6 hover:shadow-lg transition-all
                  ${announcement.type === 'error' ? 'border-red-300 dark:border-red-700' : ''}
                  ${announcement.type === 'warning' ? 'border-yellow-300 dark:border-yellow-700' : ''}
                  ${announcement.type === 'success' ? 'border-green-300 dark:border-green-700' : ''}
                  ${announcement.type === 'info' ? 'border-blue-300 dark:border-blue-700' : ''}
                  ${!announcement.isActive ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-start gap-4">
                  {/* Icône */}
                  <div className={`
                    p-3 rounded-xl
                    ${announcement.type === 'error' ? 'bg-red-100 dark:bg-red-900' : ''}
                    ${announcement.type === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900' : ''}
                    ${announcement.type === 'success' ? 'bg-green-100 dark:bg-green-900' : ''}
                    ${announcement.type === 'info' ? 'bg-blue-100 dark:bg-blue-900' : ''}
                  `}>
                    <Megaphone className="w-6 h-6" />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {announcement.title}
                        </h3>
                        
                        <span
                          className={`
                            px-2 py-0.5 rounded-full text-xs font-medium
                            ${announcement.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}
                            ${announcement.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                            ${announcement.priority === 'low' ? 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300' : ''}
                          `}
                        >
                          {announcement.priority}
                        </span>

                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                          {announcement.targetAudience}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleActive(announcement.id, announcement.isActive)}
                          className={`
                            p-2 rounded-lg transition-colors
                            ${announcement.isActive 
                              ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300' 
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                            }
                          `}
                          title={announcement.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {announcement.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>

                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {announcement.message}
                    </p>

                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                      <div>
                        Créé le {new Date(announcement.createdAt).toLocaleString('fr-FR')}
                      </div>
                      {announcement.endDate && (
                        <div>
                          Expire le {new Date(announcement.endDate).toLocaleString('fr-FR')}
                        </div>
                      )}
                      <div>
                        {announcement.readBy.length} personnes ont lu cette annonce
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {announcements.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Aucune annonce
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

