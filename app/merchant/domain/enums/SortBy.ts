/**
 * Énumération: SortBy
 * Options de tri
 */

export enum SortBy {
  DISTANCE = 'distance', // Distance
  RATING = 'rating', // Note
  PRICE = 'price', // Prix
  AVAILABILITY = 'availability', // Disponibilité
  ALPHABETICAL = 'alphabetical', // Alphabétique
  NEWEST = 'newest', // Plus récent
  POPULARITY = 'popularity', // Popularité
}

/**
 * Labels en français
 */
export const SortByLabels: Record<SortBy, string> = {
  [SortBy.DISTANCE]: 'Distance',
  [SortBy.RATING]: 'Note',
  [SortBy.PRICE]: 'Prix',
  [SortBy.AVAILABILITY]: 'Disponibilité',
  [SortBy.ALPHABETICAL]: 'Alphabétique',
  [SortBy.NEWEST]: 'Plus récent',
  [SortBy.POPULARITY]: 'Popularité',
};

/**
 * Obtenir le label d'une option de tri
 */
export function getSortByLabel(sortBy: SortBy): string {
  return SortByLabels[sortBy] || sortBy;
}

