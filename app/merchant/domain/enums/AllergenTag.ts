/**
 * Enum AllergenTag - Allergènes courants
 * Tags pour identifier les allergènes présents dans les produits alimentaires
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

export const AllergenTagDisplay: Record<AllergenTag, string> = {
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

export function getAllergenTagFromId(id: string): AllergenTag {
  const allergen = Object.values(AllergenTag).find(tag => tag === id);
  return allergen || AllergenTag.GLUTEN;
}

export function getAllergenDisplayName(tag: AllergenTag): string {
  return AllergenTagDisplay[tag];
}

export function getAllAllergenTags(): AllergenTag[] {
  return Object.values(AllergenTag);
}

export function getAllAllergenDisplayNames(): string[] {
  return Object.values(AllergenTagDisplay);
}

