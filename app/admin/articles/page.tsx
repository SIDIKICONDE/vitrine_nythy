'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Article, ArticleStatus } from '@/types/article';
import { createAuthHeaders } from '@/lib/csrf-client';

/**
 * Page de liste des articles
 */
export default function ArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ArticleStatus | 'all'>('all');
  
  // Charger les articles depuis Firebase
  useEffect(() => {
    loadArticles();
  }, [filter]);
  
  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const url = filter === 'all' 
        ? '/api/articles'
        : `/api/articles?status=${filter}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des articles');
      }
      
      const data = await response.json();
      
      // Convertir les dates string en objets Date
      const articlesWithDates = data.map((article: any) => ({
        ...article,
        createdAt: article.createdAt ? new Date(article.createdAt) : new Date(),
        updatedAt: article.updatedAt ? new Date(article.updatedAt) : new Date(),
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      }));
      
      setArticles(articlesWithDates);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${title}" ?`)) {
      return;
    }
    
    try {
      const headers = await createAuthHeaders();

      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }
      
      await loadArticles();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'article');
    }
  };
  
  const displayArticles = articles;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      published: 'bg-success/10 text-success',
      draft: 'bg-warning/10 text-warning',
      archived: 'bg-foreground-muted/10 text-foreground-muted',
    };
    const labels: Record<string, string> = {
      published: 'Publié',
      draft: 'Brouillon',
      archived: 'Archivé',
    };
    return (
      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[status] || 'bg-surface-muted text-foreground-muted'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      blog: 'Blog',
      press: 'Presse',
      resources: 'Ressources',
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Articles</h1>
          <p className="mt-2 text-foreground-muted">
            Gérez tous vos articles et actualités
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-custom-md transition-all hover:bg-primary-hover hover:shadow-custom-lg"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nouvel article
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-surface text-foreground hover:bg-surface-muted'
          }`}
        >
          Tous
        </button>
        <button
          type="button"
          onClick={() => setFilter('published')}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'published'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-surface text-foreground hover:bg-surface-muted'
          }`}
        >
          Publiés
        </button>
        <button
          type="button"
          onClick={() => setFilter('draft')}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
            filter === 'draft'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-surface text-foreground hover:bg-surface-muted'
          }`}
        >
          Brouillons
        </button>
      </div>

      {/* Tableau des articles */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-custom-sm">
        <table className="w-full">
          <thead className="border-b border-border bg-surface-muted">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Titre
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Catégorie
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Statut
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                Date
              </th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-foreground-muted">
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
                    Chargement des articles...
                  </div>
                </td>
              </tr>
            ) : displayArticles.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-foreground-muted">
                  Aucun article trouvé
                </td>
              </tr>
            ) : displayArticles.map((article) => (
              <tr key={article.id} className="hover:bg-surface-muted transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{article.title}</p>
                      {article.showInMegaMenu && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary" title="Affiché dans le méga menu">
                          📌 Menu
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground-muted line-clamp-1">
                      {article.description}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground-muted">
                    {getCategoryLabel(article.category)}
                  </span>
                </td>
                <td className="px-6 py-4">{getStatusBadge(article.status)}</td>
                <td className="px-6 py-4">
                  <span className="text-sm text-foreground-muted">
                    {article.createdAt.toLocaleDateString('fr-FR')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/articles/${article.id}`}
                      className="rounded-lg p-2 text-foreground-muted hover:bg-surface-muted hover:text-primary transition-colors"
                      title="Modifier"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(article.id, article.title)}
                      className="rounded-lg p-2 text-foreground-muted hover:bg-error/10 hover:text-error transition-colors"
                      title="Supprimer"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

