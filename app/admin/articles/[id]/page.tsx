'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import type { ArticleCategory, ArticleStatus } from '@/types/article';
import { ArticleFormHeader, FormSection, FormField, ArticleFormActions } from '@/components/admin';
import { createAuthHeaders } from '@/lib/csrf-client';

const inputClass = "w-full rounded-xl border-2 border-border bg-surface px-5 py-3 text-foreground transition-all placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10";

/**
 * Page d'édition d'un article existant - Refactorisée
 */
export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    category: 'blog' as ArticleCategory,
    status: 'draft' as ArticleStatus,
    badge: '',
    imageUrl: '',
    showInMegaMenu: false,
  });
  
  useEffect(() => {
    loadArticle();
  }, [id]);
  
  const loadArticle = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/articles/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          alert('Article non trouvé');
          router.push('/admin/articles');
          return;
        }
        throw new Error('Erreur lors du chargement');
      }
      
      const article = await response.json();
      
      setFormData({
        title: article.title,
        description: article.description,
        content: article.content,
        category: article.category,
        status: article.status,
        badge: article.badge || '',
        imageUrl: article.imageUrl || '',
        showInMegaMenu: article.showInMegaMenu || false,
      });
    } catch (error) {
      console.error('Erreur lors du chargement de l\'article:', error);
      alert('Erreur lors du chargement de l\'article');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      
      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch(`/api/articles/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      
      alert('Article mis à jour avec succès !');
      router.push('/admin/articles');
      router.refresh();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article:', error);
      alert('Erreur lors de la mise à jour de l\'article');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 animate-spin text-primary"
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
          <p className="mt-4 text-foreground-muted">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <ArticleFormHeader 
        title="Modifier l'article"
        description={`ID: ${id}`}
        isEdit
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations principales */}
        <FormSection
          title="Informations principales"
          icon={<svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        >
          <div className="space-y-5">
            <FormField label="Titre" required>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={inputClass}
                placeholder="Ex: Réduire 40% des pertes en boulangerie"
              />
            </FormField>

            <FormField label="Description" required>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={inputClass}
                placeholder="Résumé court de l'article..."
              />
            </FormField>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Catégorie" required>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ArticleCategory })}
                  className={inputClass}
                >
                  <option value="blog">📝 Blog & analyses</option>
                  <option value="press">📰 Partenariats & presse</option>
                  <option value="resources">📚 Guides & outils</option>
                </select>
              </FormField>

              <FormField label="Badge" optional>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className={inputClass}
                  placeholder="Ex: Nouveau"
                />
              </FormField>
            </div>

            <FormField label="Image de l'article" optional>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className={inputClass}
                placeholder="https://example.com/image.jpg"
              />
              {formData.imageUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border-2 border-border">
                  <img 
                    src={formData.imageUrl} 
                    alt="Preview" 
                    className="h-48 w-full object-cover"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                </div>
              )}
            </FormField>
          </div>
        </FormSection>

        {/* Contenu */}
        <FormSection
          title="Contenu de l'article"
          icon={<svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
        >
          <FormField 
            label="Contenu" 
            required
            hint="Vous pouvez utiliser Markdown pour formater votre texte"
          >
            <textarea
              required
              rows={14}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className={`${inputClass} font-mono text-sm`}
              placeholder="Écrivez le contenu de votre article en Markdown..."
            />
          </FormField>
        </FormSection>

        {/* Publication */}
        <FormSection
          title="Options de publication"
          icon={<svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
        >
          <div className="space-y-6">
            <FormField label="Statut de publication">
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ArticleStatus })}
                className={inputClass}
              >
                <option value="draft">📄 Brouillon</option>
                <option value="published">✅ Publié</option>
                <option value="archived">🗄️ Archivé</option>
              </select>
            </FormField>

            <div className="flex items-center gap-4 rounded-xl bg-primary/5 p-4">
              <input
                type="checkbox"
                id="showInMegaMenu"
                checked={formData.showInMegaMenu}
                onChange={(e) => setFormData({ ...formData, showInMegaMenu: e.target.checked })}
                className="h-5 w-5 rounded border-border text-primary transition-all focus:ring-2 focus:ring-primary/20 focus:ring-offset-2"
              />
              <label htmlFor="showInMegaMenu" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 font-semibold text-foreground">
                  <span>📌</span>
                  <span>Afficher dans le méga menu de navigation</span>
                </div>
                <p className="mt-1 text-xs text-foreground-muted">
                  L'article apparaîtra dans le menu déroulant "Actualités" du site public
                </p>
              </label>
            </div>
          </div>
        </FormSection>

        <ArticleFormActions
          isSubmitting={isSubmitting}
          status={formData.status}
          onCancel={() => router.back()}
        />
      </form>
    </div>
  );
}
