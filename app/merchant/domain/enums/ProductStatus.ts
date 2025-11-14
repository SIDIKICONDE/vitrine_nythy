/**
 * Énumération: ProductStatus
 * Statut d'un produit anti-gaspillage
 */

export enum ProductStatus {
  AVAILABLE = 'available', // ✅ Disponible
  SOLD_OUT = 'sold-out', // ❌ Épuisé
  SCHEDULED = 'scheduled', // ⏰ Programmé
  EXPIRED = 'expired', // ⏱️ Expiré
  ARCHIVED = 'archived', // 📦 Archivé
}

/**
 * Labels en français
 */
export const ProductStatusLabels: Record<ProductStatus, string> = {
  [ProductStatus.AVAILABLE]: '✅ Disponible',
  [ProductStatus.SOLD_OUT]: '❌ Épuisé',
  [ProductStatus.SCHEDULED]: '⏰ Programmé',
  [ProductStatus.EXPIRED]: '⏱️ Expiré',
  [ProductStatus.ARCHIVED]: '📦 Archivé',
};

/**
 * Obtenir le label d'un statut
 */
export function getProductStatusLabel(status: ProductStatus): string {
  return ProductStatusLabels[status] || status;
}

