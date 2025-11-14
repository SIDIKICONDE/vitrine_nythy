/**
 * Enum SuspensionReason - Raisons de suspension
 * Raisons prédéfinies pour suspendre un commerçant
 */

export enum SuspensionReason {
  VIOLATION_TERMS = 'violation-terms',
  FRAUDULENT_ACTIVITY = 'fraudulent-activity',
  QUALITY_ISSUES = 'quality-issues',
  CUSTOMER_COMPLAINTS = 'customer-complaints',
  PAYMENT_ISSUES = 'payment-issues',
  DOCUMENT_EXPIRED = 'document-expired',
  INACTIVITY = 'inactivity',
  OTHER = 'other',
}

export const SuspensionReasonDisplay: Record<SuspensionReason, string> = {
  [SuspensionReason.VIOLATION_TERMS]: 'Violation des conditions d\'utilisation',
  [SuspensionReason.FRAUDULENT_ACTIVITY]: 'Activité frauduleuse',
  [SuspensionReason.QUALITY_ISSUES]: 'Problèmes de qualité',
  [SuspensionReason.CUSTOMER_COMPLAINTS]: 'Plaintes clients répétées',
  [SuspensionReason.PAYMENT_ISSUES]: 'Problèmes de paiement',
  [SuspensionReason.DOCUMENT_EXPIRED]: 'Documents expirés',
  [SuspensionReason.INACTIVITY]: 'Inactivité prolongée',
  [SuspensionReason.OTHER]: 'Autre motif',
};

export function getSuspensionReasonFromId(id: string): SuspensionReason {
  const reason = Object.values(SuspensionReason).find(r => r === id);
  return reason || SuspensionReason.OTHER;
}

export function getSuspensionReasonDisplay(reason: SuspensionReason): string {
  return SuspensionReasonDisplay[reason];
}

