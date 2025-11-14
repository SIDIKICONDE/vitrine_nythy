/**
 * Enum SuspensionSortBy - Options de tri pour les suspensions
 */

export enum SuspensionSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  EXPIRATION_DATE = 'expiration-date',
  MERCHANT_NAME = 'merchant-name',
  SUSPENSION_TYPE = 'suspension-type',
}

export const SuspensionSortByDisplay: Record<SuspensionSortBy, string> = {
  [SuspensionSortBy.NEWEST]: 'Plus récent',
  [SuspensionSortBy.OLDEST]: 'Plus ancien',
  [SuspensionSortBy.EXPIRATION_DATE]: 'Date d\'expiration',
  [SuspensionSortBy.MERCHANT_NAME]: 'Nom du commerçant',
  [SuspensionSortBy.SUSPENSION_TYPE]: 'Type de suspension',
};

export function getSuspensionSortByFromId(id: string): SuspensionSortBy {
  const sortBy = Object.values(SuspensionSortBy).find(s => s === id);
  return sortBy || SuspensionSortBy.NEWEST;
}

export function getSuspensionSortByDisplay(sortBy: SuspensionSortBy): string {
  return SuspensionSortByDisplay[sortBy];
}

