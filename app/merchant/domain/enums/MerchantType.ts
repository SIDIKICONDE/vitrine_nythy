/**
 * Énumération: MerchantType
 * Types de commerce (19 types)
 */

export enum MerchantType {
  RESTAURANT = 'restaurant',
  BOULANGERIE = 'boulangerie',
  PATISSERIE = 'patisserie',
  SUPERMARCHE = 'supermarche',
  EPICERIE = 'epicerie',
  CAFE = 'cafe',
  TRAITEUR = 'traiteur',
  PRIMEUR = 'primeur',
  BOUCHERIE = 'boucherie',
  CHARCUTERIE = 'charcuterie',
  POISSONNERIE = 'poissonnerie',
  FROMAGERIE = 'fromagerie',
  CHOCOLATERIE = 'chocolaterie',
  GLACIERE = 'glaciere',
  PIZZERIA = 'pizzeria',
  FASTFOOD = 'fastFood',
  BIOLOGIQUE = 'biologique',
  VEGAN = 'vegan',
  AUTRE = 'autre',
}

/**
 * Labels en français avec emojis
 */
export const MerchantTypeLabels: Record<MerchantType, string> = {
  [MerchantType.RESTAURANT]: '🍽️ Restaurant',
  [MerchantType.BOULANGERIE]: '🥖 Boulangerie',
  [MerchantType.PATISSERIE]: '🧁 Pâtisserie',
  [MerchantType.SUPERMARCHE]: '🛒 Supermarché',
  [MerchantType.EPICERIE]: '🏪 Épicerie',
  [MerchantType.CAFE]: '☕ Café',
  [MerchantType.TRAITEUR]: '🍱 Traiteur',
  [MerchantType.PRIMEUR]: '🥬 Primeur',
  [MerchantType.BOUCHERIE]: '🥩 Boucherie',
  [MerchantType.CHARCUTERIE]: '🥓 Charcuterie',
  [MerchantType.POISSONNERIE]: '🐟 Poissonnerie',
  [MerchantType.FROMAGERIE]: '🧀 Fromagerie',
  [MerchantType.CHOCOLATERIE]: '🍫 Chocolaterie',
  [MerchantType.GLACIERE]: '🍦 Glacier',
  [MerchantType.PIZZERIA]: '🍕 Pizzeria',
  [MerchantType.FASTFOOD]: '🍔 Fast-food',
  [MerchantType.BIOLOGIQUE]: '🌱 Biologique',
  [MerchantType.VEGAN]: '🌿 Vegan',
  [MerchantType.AUTRE]: '🏬 Autre',
};

/**
 * Obtenir le label d'un type
 */
export function getMerchantTypeLabel(type: MerchantType): string {
  return MerchantTypeLabels[type] || type;
}

