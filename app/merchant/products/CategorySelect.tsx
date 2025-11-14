/**
 * CategorySelect - Sélecteur de catégorie personnalisé
 */

'use client';

import { ProductCategory, ProductCategoryLabels, getAllCategories } from '@/types/product-categories';
import { useEffect, useRef, useState } from 'react';

interface CategorySelectProps {
  value: string;
  onChange: (category: string) => void;
  required?: boolean;
  categories?: ProductCategory[]; // Catégories à afficher (optionnel, sinon toutes)
  disabled?: boolean;
}

export default function CategorySelect({ value, onChange, required = false, categories, disabled = false }: CategorySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const allCategories = categories || getAllCategories();

  // Filtrer les catégories selon la recherche
  const filteredCategories = allCategories.filter(category => {
    if (!searchQuery) return true;
    const label = ProductCategoryLabels[category].toLowerCase();
    return label.includes(searchQuery.toLowerCase());
  });

  const selectedCategory = value ? (ProductCategoryLabels[value as ProductCategory] || value) : null;

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (category: ProductCategory) => {
    onChange(category);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-xl border transition-all
          ${isOpen
            ? 'border-primary ring-2 ring-primary/20 bg-surface'
            : 'border-border hover:border-primary/50 bg-surface'
          }
          ${!value && required ? 'border-red-300' : ''}
          ${disabled ? 'bg-surface-muted cursor-not-allowed opacity-60' : ''}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-primary"
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
            <span className={value ? 'text-foreground font-medium' : 'text-foreground-muted'}>
              {selectedCategory || 'Sélectionnez une catégorie'}
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-foreground-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-surface border border-border rounded-xl shadow-custom-lg overflow-hidden">
          {/* Barre de recherche */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une catégorie..."
                className="w-full px-4 py-2 pl-10 rounded-lg border border-border bg-surface-hover text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted"
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
            </div>
          </div>

          {/* Liste des catégories */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => {
                const label = ProductCategoryLabels[category];
                const isSelected = value === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleSelect(category)}
                    className={`
                      w-full px-4 py-3 text-left transition-colors
                      ${isSelected
                        ? 'bg-primary/10 text-primary font-semibold border-l-4 border-primary'
                        : 'hover:bg-surface-hover text-foreground'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{label.split(' ')[0]}</span>
                      <span className="flex-1">{label.substring(label.indexOf(' ') + 1)}</span>
                      {isSelected && (
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-foreground-muted">
                <p>Aucune catégorie trouvée</p>
                <p className="text-sm mt-1">Essayez une autre recherche</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Champ caché pour la validation HTML5 */}
      <input
        type="hidden"
        value={value}
        required={required}
      />
    </div>
  );
}

