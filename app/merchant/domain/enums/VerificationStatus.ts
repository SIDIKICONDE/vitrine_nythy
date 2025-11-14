/**
 * Enum VerificationStatus - Statut de vérification
 * États de vérification d'un commerçant
 */

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under-review',
  DOCUMENTS_REQUESTED = 'documents-requested',
}

export const VerificationStatusDisplay: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]: 'En attente',
  [VerificationStatus.VERIFIED]: 'Vérifié',
  [VerificationStatus.REJECTED]: 'Rejeté',
  [VerificationStatus.UNDER_REVIEW]: 'En cours de révision',
  [VerificationStatus.DOCUMENTS_REQUESTED]: 'Documents requis',
};

export function getVerificationStatusFromId(id: string): VerificationStatus {
  const status = Object.values(VerificationStatus).find(s => s === id);
  return status || VerificationStatus.PENDING;
}

export function getVerificationStatusDisplay(status: VerificationStatus): string {
  return VerificationStatusDisplay[status];
}

/**
 * Vérifier si le statut est approuvé
 */
export function isApproved(status: VerificationStatus): boolean {
  return status === VerificationStatus.VERIFIED;
}

/**
 * Vérifier si le statut est rejeté
 */
export function isRejected(status: VerificationStatus): boolean {
  return status === VerificationStatus.REJECTED;
}

/**
 * Vérifier si le statut est en attente
 */
export function isPending(status: VerificationStatus): boolean {
  return status === VerificationStatus.PENDING ||
         status === VerificationStatus.UNDER_REVIEW ||
         status === VerificationStatus.DOCUMENTS_REQUESTED;
}

