import type { MegaMenuItem } from './types';
import styles from './ArticleCard.module.css';

interface ArticleCardProps {
  article: MegaMenuItem;
}

/**
 * Carte d'article avec effet Liquid Glass pour le méga menu
 */
export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <a
      href={article.href}
      className={`${styles.liquidGlass} group`}
    >
      <div className="flex gap-4 h-full">
        {/* Image */}
        {article.imageUrl && (
          <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-surface-muted">
            <img 
              src={article.imageUrl} 
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Contenu */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* En-tête avec titre et badge */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
              {article.title}
            </h4>
            {article.badge && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground shrink-0">
                {article.badge}
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed text-foreground-muted line-clamp-2 mb-3 flex-1">
            {article.description}
          </p>

          {/* Indicateur de lien */}
          <div className="flex items-center gap-2 text-xs font-medium text-primary mt-auto">
            <span>Lire l'article</span>
            <svg
              className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M5.22 4.22a.75.75 0 0 1 1.06 0L10 7.94 6.28 11.7a.75.75 0 1 1-1.06-1.06L7.94 8 5.22 5.28a.75.75 0 0 1 0-1.06z" />
            </svg>
          </div>
        </div>
      </div>
    </a>
  );
}

