/**
 * Allergènes courants pour les produits alimentaires
 * Aligné sur le domaine Flutter (lib/features/merchants/domain/enums.dart)
 */

export enum AllergenTag {
  GLUTEN = 'gluten',
  LACTOSE = 'lactose',
  EGGS = 'eggs',
  NUTS = 'nuts',
  PEANUTS = 'peanuts',
  SOY = 'soy',
  FISH = 'fish',
  SHELLFISH = 'shellfish',
  SESAME = 'sesame',
  MUSTARD = 'mustard',
  CELERY = 'celery',
  LUPIN = 'lupin',
  MOLLUSCS = 'molluscs',
  SULPHITES = 'sulphites',
}

export const AllergenTagLabels: Record<AllergenTag, string> = {
  [AllergenTag.GLUTEN]: 'Gluten',
  [AllergenTag.LACTOSE]: 'Lactose',
  [AllergenTag.EGGS]: 'Œufs',
  [AllergenTag.NUTS]: 'Fruits à coque',
  [AllergenTag.PEANUTS]: 'Arachides',
  [AllergenTag.SOY]: 'Soja',
  [AllergenTag.FISH]: 'Poisson',
  [AllergenTag.SHELLFISH]: 'Crustacés',
  [AllergenTag.SESAME]: 'Sésame',
  [AllergenTag.MUSTARD]: 'Moutarde',
  [AllergenTag.CELERY]: 'Céleri',
  [AllergenTag.LUPIN]: 'Lupin',
  [AllergenTag.MOLLUSCS]: 'Mollusques',
  [AllergenTag.SULPHITES]: 'Sulfites',
};

/**
 * Obtenir le label d'un allergène
 */
export function getAllergenLabel(tag: AllergenTag): string {
  return AllergenTagLabels[tag] || tag;
}

/**
 * Obtenir tous les allergènes
 */
export function getAllAllergens(): AllergenTag[] {
  return Object.values(AllergenTag);
}

