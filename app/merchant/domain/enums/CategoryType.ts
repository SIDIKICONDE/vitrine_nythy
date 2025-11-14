/**
 * Enum CategoryType - Type de catégorie
 * Définit les différents types de catégories dans le système
 */

export enum CategoryType {
  PRODUCT = 'product',
  MERCHANT = 'merchant',
  SERVICE = 'service',
  EVENT = 'event',
}

export const CategoryTypeDisplay: Record<CategoryType, string> = {
  [CategoryType.PRODUCT]: 'Produit',
  [CategoryType.MERCHANT]: 'Commerçant',
  [CategoryType.SERVICE]: 'Service',
  [CategoryType.EVENT]: 'Événement',
};

export const CategoryTypeEmoji: Record<CategoryType, string> = {
  [CategoryType.PRODUCT]: '🍽️',
  [CategoryType.MERCHANT]: '🏦',
  [CategoryType.SERVICE]: '⚙️',
  [CategoryType.EVENT]: '🎉',
};

export const CategoryTypeDescription: Record<CategoryType, string> = {
  [CategoryType.PRODUCT]: 'Catégories pour classer les produits anti-gaspillage par type alimentaire',
  [CategoryType.MERCHANT]: 'Catégories pour classer les commerçants par secteur d\'activité',
  [CategoryType.SERVICE]: 'Catégories pour les services proposés (livraison, retrait, etc.)',
  [CategoryType.EVENT]: 'Catégories pour les événements et promotions anti-gaspillage',
};

export const CategoryTypeColor: Record<CategoryType, string> = {
  [CategoryType.PRODUCT]: '#4CAF50', // Vert
  [CategoryType.MERCHANT]: '#2196F3', // Bleu
  [CategoryType.SERVICE]: '#FF9800', // Orange
  [CategoryType.EVENT]: '#9C27B0', // Violet
};

export function getCategoryTypeFromId(id: string): CategoryType {
  const type = Object.values(CategoryType).find(t => t === id);
  return type || CategoryType.PRODUCT;
}

export function getCategoryTypeDisplay(type: CategoryType): string {
  return CategoryTypeDisplay[type];
}

export function getCategoryTypeEmoji(type: CategoryType): string {
  return CategoryTypeEmoji[type];
}

export function getCategoryTypeDescription(type: CategoryType): string {
  return CategoryTypeDescription[type];
}

export function getCategoryTypeColor(type: CategoryType): string {
  return CategoryTypeColor[type];
}

export function getAllCategoryTypesWithEmojis(): string[] {
  return Object.values(CategoryType).map(
    type => `${CategoryTypeEmoji[type]} ${CategoryTypeDisplay[type]}`
  );
}

