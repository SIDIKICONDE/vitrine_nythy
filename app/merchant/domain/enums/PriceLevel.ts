/**
 * Énumération: PriceLevel
 * Niveau de prix
 */

export enum PriceLevel {
  LOW = 'low', // € Économique
  MEDIUM = 'medium', // €€ Modéré
  HIGH = 'high', // €€€ Élevé
  PREMIUM = 'premium', // €€€€ Premium
}

/**
 * Labels en français avec symboles
 */
export const PriceLevelLabels: Record<PriceLevel, string> = {
  [PriceLevel.LOW]: '€ Économique',
  [PriceLevel.MEDIUM]: '€€ Modéré',
  [PriceLevel.HIGH]: '€€€ Élevé',
  [PriceLevel.PREMIUM]: '€€€€ Premium',
};

/**
 * Obtenir le label d'un niveau de prix
 */
export function getPriceLevelLabel(level: PriceLevel): string {
  return PriceLevelLabels[level] || level;
}

