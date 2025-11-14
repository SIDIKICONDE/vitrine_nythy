/**
 * Enum DocumentType - Type de document
 * Types de documents pour la vérification des commerçants
 */

export enum DocumentType {
  BUSINESS_LICENSE = 'business-license',
  TAX_CERTIFICATE = 'tax-certificate',
  IDENTITY_CARD = 'identity-card',
  PROOF_OF_ADDRESS = 'proof-of-address',
  BANK_STATEMENT = 'bank-statement',
  INSURANCE_CERTIFICATE = 'insurance-certificate',
  HEALTH_PERMIT = 'health-permit',
}

export const DocumentTypeDisplay: Record<DocumentType, string> = {
  [DocumentType.BUSINESS_LICENSE]: 'Licence commerciale',
  [DocumentType.TAX_CERTIFICATE]: 'Certificat fiscal',
  [DocumentType.IDENTITY_CARD]: 'Pièce d\'identité',
  [DocumentType.PROOF_OF_ADDRESS]: 'Justificatif de domicile',
  [DocumentType.BANK_STATEMENT]: 'Relevé bancaire',
  [DocumentType.INSURANCE_CERTIFICATE]: 'Certificat d\'assurance',
  [DocumentType.HEALTH_PERMIT]: 'Permis sanitaire',
};

export function getDocumentTypeFromId(id: string): DocumentType {
  const docType = Object.values(DocumentType).find(t => t === id);
  return docType || DocumentType.BUSINESS_LICENSE;
}

export function getDocumentTypeDisplay(type: DocumentType): string {
  return DocumentTypeDisplay[type];
}

