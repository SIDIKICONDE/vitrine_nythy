/**
 * Enum SuspensionType - Type de suspension
 * Types de suspension pour les commerçants
 */

export enum SuspensionType {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
  WARNING = 'warning',
}

export const SuspensionTypeDisplay: Record<SuspensionType, string> = {
  [SuspensionType.TEMPORARY]: 'Suspension temporaire',
  [SuspensionType.PERMANENT]: 'Suspension permanente',
  [SuspensionType.WARNING]: 'Avertissement',
};

export function getSuspensionTypeFromId(id: string): SuspensionType {
  const type = Object.values(SuspensionType).find(t => t === id);
  return type || SuspensionType.WARNING;
}

export function getSuspensionTypeDisplay(type: SuspensionType): string {
  return SuspensionTypeDisplay[type];
}

/**
 * Vérifier si la suspension nécessite une durée
 */
export function requiresDuration(type: SuspensionType): boolean {
  return type === SuspensionType.TEMPORARY;
}

/**
 * Vérifier si l'accès est autorisé
 */
export function allowsAccess(type: SuspensionType): boolean {
  return type === SuspensionType.WARNING;
}

