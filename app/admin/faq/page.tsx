'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { FAQ } from '@/types/admin';
import { Edit, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';

/**
 * Page de gestion de la FAQ
 */
export default function AdminFaqPage(): ReactElement {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFaqs();
  }, []);

  const loadFaqs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/faq');
      const data = await response.json();
      setFaqs(data.faqs || []);
    } catch (error) {
      console.error('Erreur chargement FAQ:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePublished = async (faqId: string, isPublished: boolean) => {
    try {
      await fetch(`/api/admin/faq/${faqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !isPublished }),
      });
      await loadFaqs();
    } catch (error) {
      console.error('Erreur toggle FAQ:', error);
    }
  };

  const handleDelete = async (faqId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      return;
    }

    try {
      await fetch(`/api/admin/faq/${faqId}`, {
        method: 'DELETE',
      });
      await loadFaqs();
    } catch (error) {
      console.error('Erreur suppression FAQ:', error);
    }
  };

  // Grouper les FAQs par catégorie
  const faqsByCategory = faqs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = [];
    }
    acc[faq.category]!.push(faq);
    return acc;
  }, {} as Record<string, FAQ[]>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion de la FAQ
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {faqs.length} questions au total
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
            <Plus className="w-5 h-5" />
            Nouvelle question
          </button>
        </div>

        {/* Liste des FAQs par catégorie */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(faqsByCategory).map(([category, categoryFaqs]) => (
              <div key={category}>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {category}
                </h2>
                <div className="space-y-4">
                  {categoryFaqs
                    .sort((a, b) => a.order - b.order)
                    .map((faq) => (
                      <div
                        key={faq.id}
                        className={`
                          bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6
                          ${!faq.isPublished ? 'opacity-50' : ''}
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {faq.question}
                              </h3>
                              {!faq.isPublished && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                                  Brouillon
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                              {faq.answer}
                            </p>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {faq.views} vues • Ordre: {faq.order}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTogglePublished(faq.id, faq.isPublished)}
                              className={`
                                p-2 rounded-lg transition-colors
                                ${faq.isPublished 
                                  ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900 dark:text-green-300' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                }
                              `}
                              title={faq.isPublished ? 'Dépublier' : 'Publier'}
                            >
                              {faq.isPublished ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                            </button>

                            <button
                              className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300 transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => handleDelete(faq.id)}
                              className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}

            {Object.keys(faqsByCategory).length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Aucune question dans la FAQ
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

