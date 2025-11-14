/**
 * Enum PendingVerificationSortBy - Options de tri pour les vérifications en attente
 */

export enum PendingVerificationSortBy {
  OLDEST = 'oldest',
  NEWEST = 'newest',
  ALPHABETICAL = 'alphabetical',
  PRIORITY = 'priority',
}

export const PendingVerificationSortByDisplay: Record<PendingVerificationSortBy, string> = {
  [PendingVerificationSortBy.OLDEST]: 'Plus ancien',
  [PendingVerificationSortBy.NEWEST]: 'Plus récent',
  [PendingVerificationSortBy.ALPHABETICAL]: 'Alphabétique',
  [PendingVerificationSortBy.PRIORITY]: 'Priorité',
};

export function getPendingVerificationSortByFromId(id: string): PendingVerificationSortBy {
  const sortBy = Object.values(PendingVerificationSortBy).find(s => s === id);
  return sortBy || PendingVerificationSortBy.NEWEST;
}

export function getPendingVerificationSortByDisplay(sortBy: PendingVerificationSortBy): string {
  return PendingVerificationSortByDisplay[sortBy];
}

