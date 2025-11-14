'use client';

import { useEffect, useState } from 'react';
import type { Article } from '@/types/article';
import { ArticleCard } from './ArticleCard';
import type { MegaMenuSection } from './types';

// Configuration des sections par catégorie
const categoryConfig = {
  blog: {
    eyebrow: 'Chroniques',
    title: 'Blog & analyses',
    description: "Analyses de terrain, retours d'expérience et bonnes pratiques anti-gaspi.",
  },
  press: {
    eyebrow: 'Communiqués',
    title: 'Partenariats & presse',
    description: 'Les grandes annonces et les collaborations institutionnelles.',
  },
  resources: {
    eyebrow: 'Ressources',
    title: 'Guides & outils',
    description: 'Documents téléchargeables pour activer votre plan anti-gaspillage.',
  },
};

interface MegaMenuProps {
  isOpen: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/**
 * Méga menu des actualités - Charge les articles depuis Firebase
 */
export function MegaMenu({ isOpen, onMouseEnter, onMouseLeave }: MegaMenuProps) {
  const [sections, setSections] = useState<MegaMenuSection[]>([]);

  useEffect(() => {
    const loadArticles = async () => {
      try {
        const response = await fetch('/api/articles/public');
        if (!response.ok) return;

        const articles: Article[] = await response.json();
        const menuArticles = articles.filter(article => article.showInMegaMenu);

        const newSections: MegaMenuSection[] = ['blog', 'press', 'resources']
          .map((categoryId) => {
            const category = categoryId as keyof typeof categoryConfig;
            const categoryArticles = menuArticles
              .filter(article => article.category === category)
              .slice(0, 3);

            return {
              id: categoryId,
              ...categoryConfig[category],
              items: categoryArticles.map(article => ({
                title: article.title,
                description: article.description,
                href: `#actualites/${article.slug}`,
                badge: article.badge,
                imageUrl: article.imageUrl,
              })),
            };
          })
          .filter(section => section.items.length > 0);

        setSections(newSections);
      } catch (error) {
        console.error('Erreur lors du chargement du méga menu:', error);
      }
    };

    loadArticles();
  }, []);

  return (
    <div
      id="actualites-mega-menu"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`liquid-glass absolute left-1/2 top-full mt-4 w-[min(900px,calc(100vw-3rem))] -translate-x-1/2 transform overflow-hidden rounded-[14px] transition-all duration-200 z-50 ${
        isOpen ? 'pointer-events-auto opacity-100 translate-y-0' : 'pointer-events-none opacity-0 -translate-y-2'
      }`}
    >
      {sections.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-foreground-muted">
            Aucun article disponible pour le moment. Revenez bientôt !
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 px-6 py-6 md:grid-cols-3">
            {sections.map((section) => (
              <div key={section.id} className="flex flex-col">
                <span className="text-[11px] uppercase tracking-[0.25em] text-primary">
                  {section.eyebrow}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-foreground">
                  {section.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
                  {section.description}
                </p>
                <div className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <ArticleCard key={item.title} article={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 border-t border-border bg-surface-muted/50 px-6 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Envie de plus d'actualités ?</p>
              <p className="text-xs text-foreground-muted">Accédez à la section complète pour tout savoir sur l'univers Nythy.</p>
            </div>
            <a
              href="#actualites"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground transition-all hover:bg-primary-hover hover:shadow-custom-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Voir toutes les actualités
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M7.293 5.293a1 1 0 0 1 1.414 0L13 9.586l-4.293 4.293a1 1 0 1 1-1.414-1.414L10.172 10 7.293 7.121a1 1 0 0 1 0-1.828z" />
              </svg>
            </a>
          </div>
        </>
      )}
    </div>
  );
}

