/**
 * Tags diététiques courants pour les produits
 * Aligné sur le domaine Flutter (lib/features/merchants/domain/enums.dart)
 */

export enum DietaryTag {
  VEGETARIAN = 'vegetarian',
  VEGAN = 'vegan',
  GLUTEN_FREE = 'gluten-free',
  DAIRY_FREE = 'dairy-free',
  NUT_FREE = 'nut-free',
  SUGAR_FREE = 'sugar-free',
  ORGANIC = 'organic',
  HALAL = 'halal',
  KOSHER = 'kosher',
  LOW_CALORIE = 'low-calorie',
  HIGH_PROTEIN = 'high-protein',
  LOCAL = 'local',
}

export const DietaryTagLabels: Record<DietaryTag, { label: string; emoji: string }> = {
  [DietaryTag.VEGETARIAN]: { label: 'Végétarien', emoji: '🥬' },
  [DietaryTag.VEGAN]: { label: 'Vegan', emoji: '🌱' },
  [DietaryTag.GLUTEN_FREE]: { label: 'Sans gluten', emoji: '🌾' },
  [DietaryTag.DAIRY_FREE]: { label: 'Sans lactose', emoji: '🥛' },
  [DietaryTag.NUT_FREE]: { label: 'Sans noix', emoji: '🥜' },
  [DietaryTag.SUGAR_FREE]: { label: 'Sans sucre', emoji: '🍯' },
  [DietaryTag.ORGANIC]: { label: 'Bio', emoji: '🌿' },
  [DietaryTag.HALAL]: { label: 'Halal', emoji: '🕌' },
  [DietaryTag.KOSHER]: { label: 'Casher', emoji: '✡️' },
  [DietaryTag.LOW_CALORIE]: { label: 'Faible calorie', emoji: '⚖️' },
  [DietaryTag.HIGH_PROTEIN]: { label: 'Riche en protéines', emoji: '💪' },
  [DietaryTag.LOCAL]: { label: 'Local', emoji: '📍' },
};

/**
 * Obtenir le label d'un tag diététique
 */
export function getDietaryTagLabel(tag: DietaryTag): string {
  return DietaryTagLabels[tag]?.label || tag;
}

/**
 * Obtenir l'emoji d'un tag diététique
 */
export function getDietaryTagEmoji(tag: DietaryTag): string {
  return DietaryTagLabels[tag]?.emoji || '';
}

/**
 * Obtenir tous les tags diététiques
 */
export function getAllDietaryTags(): DietaryTag[] {
  return Object.values(DietaryTag);
}

