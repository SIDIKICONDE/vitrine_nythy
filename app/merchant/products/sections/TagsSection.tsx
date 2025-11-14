/**
 * TagsSection - Section tags diététiques et allergènes
 * Aligné sur Flutter (tags_section.dart)
 */

'use client';

import { DietaryTag, DietaryTagLabels, getAllDietaryTags } from '@/types/dietary-tags';
import { AllergenTag, AllergenTagLabels, getAllAllergens } from '@/types/allergen-tags';

interface TagsSectionProps {
  dietaryTags: string[];
  allergenTags: string[];
  onDietaryTagsChange: (tags: string[]) => void;
  onAllergenTagsChange: (tags: string[]) => void;
  disabled?: boolean;
}

export default function TagsSection({
  dietaryTags,
  allergenTags,
  onDietaryTagsChange,
  onAllergenTagsChange,
  disabled = false,
}: TagsSectionProps) {
  const handleDietaryTagToggle = (tag: DietaryTag) => {
    const tagId = tag;
    const newTags = dietaryTags.includes(tagId)
      ? dietaryTags.filter(t => t !== tagId)
      : [...dietaryTags, tagId];
    onDietaryTagsChange(newTags);
  };

  const handleAllergenToggle = (tag: AllergenTag) => {
    const tagId = tag;
    const newTags = allergenTags.includes(tagId)
      ? allergenTags.filter(t => t !== tagId)
      : [...allergenTags, tagId];
    onAllergenTagsChange(newTags);
  };

  return (
    <div className="liquid-glass p-6 space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">
        Tags et informations
      </h3>

      {disabled && (
        <p className="text-xs text-foreground-muted bg-surface-hover p-3 rounded-lg mb-4">
          💡 Tags désactivés pour les paniers surprise (contenu variable)
        </p>
      )}

      {/* Tags diététiques */}
      <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        <h4 className={`text-sm font-semibold mb-2 ${disabled ? 'text-foreground-muted' : 'text-foreground'}`}>
          Tags diététiques
        </h4>
        <p className="text-xs text-foreground-muted mb-3">
          Caractéristiques diététiques du produit
        </p>
        <div className="flex flex-wrap gap-2">
          {getAllDietaryTags().map((tag) => {
            const isSelected = dietaryTags.includes(tag);
            const tagInfo = DietaryTagLabels[tag];
            return (
              <button
                key={tag}
                type="button"
                onClick={() => !disabled && handleDietaryTagToggle(tag)}
                disabled={disabled}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${isSelected
                    ? 'bg-primary text-white shadow-md'
                    : 'bg-surface-hover text-foreground-muted hover:bg-surface-active'
                  }
                  ${disabled ? 'cursor-not-allowed' : ''}
                `}
              >
                <span className="flex items-center gap-1.5">
                  <span>{tagInfo.emoji}</span>
                  <span>{tagInfo.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-4"></div>

      {/* Allergènes */}
      <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
        <h4 className={`text-sm font-semibold mb-2 ${disabled ? 'text-foreground-muted' : 'text-foreground'}`}>
          Allergènes présents
        </h4>
        <p className="text-xs text-foreground-muted mb-3">
          Allergènes contenus dans le produit
        </p>
        <div className="flex flex-wrap gap-2">
          {getAllAllergens().map((tag) => {
            const isSelected = allergenTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => !disabled && handleAllergenToggle(tag)}
                disabled={disabled}
                className={`
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${isSelected
                    ? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                    : 'bg-surface-hover text-foreground-muted hover:bg-surface-active border-2 border-transparent'
                  }
                  ${disabled ? 'cursor-not-allowed' : ''}
                `}
              >
                {AllergenTagLabels[tag]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

