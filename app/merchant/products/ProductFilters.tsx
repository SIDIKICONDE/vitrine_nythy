/**
 * ProductFilters - Filtres de produits pour marchands
 * Aligné sur le widget Flutter (lib/features/merchants/presentation/web/pages/products/widgets/product_filters.dart)
 */

'use client';

import { ProductCategory, ProductCategoryLabels, getAllCategories } from '@/types/product-categories';

interface ProductFiltersProps {
  searchQuery: string;
  selectedCategory: string | null;
  showActiveOnly: boolean;
  categories?: string[];
  onSearchChanged: (query: string) => void;
  onCategoryChanged: (category: string | null) => void;
  onActiveOnlyToggled: () => void;
}

export default function ProductFilters({
  searchQuery,
  selectedCategory,
  showActiveOnly,
  categories = [],
  onSearchChanged,
  onCategoryChanged,
  onActiveOnlyToggled,
}: ProductFiltersProps) {
  // Utiliser les catégories fournies ou toutes les catégories disponibles
  const availableCategories = categories.length > 0
    ? categories
    : getAllCategories().map(cat => cat);

  return (
    <div className="liquid-glass p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Barre de recherche */}
        <div className="flex-1 min-w-[300px] max-w-[450px]">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChanged(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full px-4 py-3 pl-11 rounded-2xl border border-border/50 bg-surface/50 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => onSearchChanged('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground transition-colors"
                title="Effacer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filtre par catégorie */}
        {availableCategories.length > 0 && (
          <div className="min-w-[180px] max-w-[220px]">
            <div className="relative">
              <select
                value={selectedCategory || ''}
                onChange={(e) => onCategoryChanged(e.target.value || null)}
                className="w-full px-4 py-3 pl-11 rounded-2xl border border-border/50 bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none cursor-pointer"
              >
                <option value="">📋 Toutes les catégories</option>
                {availableCategories.map((category) => {
                  const categoryKey = category as ProductCategory;
                  const label = ProductCategoryLabels[categoryKey] || category;
                  return (
                    <option key={category} value={category}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Toggle actifs seulement */}
        <button
          onClick={onActiveOnlyToggled}
          className={`
            flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all
            ${showActiveOnly
              ? 'bg-primary-container text-primary border-2 border-primary/30 shadow-md'
              : 'bg-surface-hover/50 text-foreground-muted border-2 border-border/30 hover:bg-surface-active'
            }
          `}
        >
          {showActiveOnly ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 011-1h4a1 1 0 110 2h-4a1 1 0 01-1-1z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span className="text-sm font-semibold">Actifs seulement</span>
        </button>
      </div>
    </div>
  );
}

