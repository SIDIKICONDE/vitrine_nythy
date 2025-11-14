/**
 * Énumération: DietaryTag
 * Tags diététiques (12 tags)
 */

export enum DietaryTag {
  VEGETARIAN = 'vegetarian', // 🥬 Végétarien
  VEGAN = 'vegan', // 🌱 Vegan
  GLUTEN_FREE = 'glutenFree', // 🌾 Sans gluten
  DAIRY_FREE = 'dairyFree', // 🥛 Sans lactose
  NUT_FREE = 'nutFree', // 🥜 Sans noix
  SUGAR_FREE = 'sugarFree', // 🍯 Sans sucre
  ORGANIC = 'organic', // 🌿 Bio
  HALAL = 'halal', // 🕌 Halal
  KOSHER = 'kosher', // ✡️ Casher
  LOW_CALORIE = 'lowCalorie', // ⚖️ Faible calorie
  HIGH_PROTEIN = 'highProtein', // 💪 Riche en protéines
  LOCAL = 'local', // 📍 Local
}

/**
 * Labels en français avec emojis
 */
export const DietaryTagLabels: Record<DietaryTag, string> = {
  [DietaryTag.VEGETARIAN]: '🥬 Végétarien',
  [DietaryTag.VEGAN]: '🌱 Vegan',
  [DietaryTag.GLUTEN_FREE]: '🌾 Sans gluten',
  [DietaryTag.DAIRY_FREE]: '🥛 Sans lactose',
  [DietaryTag.NUT_FREE]: '🥜 Sans noix',
  [DietaryTag.SUGAR_FREE]: '🍯 Sans sucre',
  [DietaryTag.ORGANIC]: '🌿 Bio',
  [DietaryTag.HALAL]: '🕌 Halal',
  [DietaryTag.KOSHER]: '✡️ Casher',
  [DietaryTag.LOW_CALORIE]: '⚖️ Faible calorie',
  [DietaryTag.HIGH_PROTEIN]: '💪 Riche en protéines',
  [DietaryTag.LOCAL]: '📍 Local',
};

/**
 * Obtenir le label d'un tag
 */
export function getDietaryTagLabel(tag: DietaryTag): string {
  return DietaryTagLabels[tag] || tag;
}

