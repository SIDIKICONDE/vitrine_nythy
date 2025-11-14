/**
 * Enum MerchantSortBy - Options de tri pour les commerçants
 * Options de tri spécifiques aux commerçants
 */

export enum MerchantSortBy {
  DISTANCE = 'distance',
  RATING = 'rating',
  NAME = 'name',
  NEWEST = 'newest',
  POPULARITY = 'popularity',
  RELEVANCE = 'relevance',
}

export const MerchantSortByDisplay: Record<MerchantSortBy, string> = {
  [MerchantSortBy.DISTANCE]: 'Distance',
  [MerchantSortBy.RATING]: 'Note',
  [MerchantSortBy.NAME]: 'Nom',
  [MerchantSortBy.NEWEST]: 'Plus récent',
  [MerchantSortBy.POPULARITY]: 'Popularité',
  [MerchantSortBy.RELEVANCE]: 'Pertinence',
};

export const MerchantSortByFirestoreField: Record<MerchantSortBy, string> = {
  [MerchantSortBy.DISTANCE]: 'distance',
  [MerchantSortBy.RATING]: 'rating.average',
  [MerchantSortBy.NAME]: 'name',
  [MerchantSortBy.NEWEST]: 'createdAt',
  [MerchantSortBy.POPULARITY]: 'rating.count',
  [MerchantSortBy.RELEVANCE]: 'relevanceScore',
};

export function getMerchantSortByFromId(id: string): MerchantSortBy {
  const sortBy = Object.values(MerchantSortBy).find(s => s === id);
  return sortBy || MerchantSortBy.DISTANCE;
}

export function getMerchantSortByDisplay(sortBy: MerchantSortBy): string {
  return MerchantSortByDisplay[sortBy];
}

export function getMerchantSortByFirestoreField(sortBy: MerchantSortBy): string {
  return MerchantSortByFirestoreField[sortBy];
}

/**
 * Vérifier si le tri nécessite des coordonnées utilisateur
 */
export function requiresUserLocation(sortBy: MerchantSortBy): boolean {
  return sortBy === MerchantSortBy.DISTANCE;
}

/**
 * Vérifier si le tri nécessite des données de notation
 */
export function requiresRatingData(sortBy: MerchantSortBy): boolean {
  return sortBy === MerchantSortBy.RATING || sortBy === MerchantSortBy.POPULARITY;
}

