/**
 * Types et énumérations pour les marchands
 * Portage de l'architecture Flutter vers TypeScript
 */

// Types de commerce
export enum MerchantType {
  RESTAURANT = 'restaurant',
  BOULANGERIE = 'boulangerie',
  PATISSERIE = 'patisserie',
  SUPERMARCHE = 'supermarche',
  EPICERIE = 'epicerie',
  CAFE = 'cafe',
  TRAITEUR = 'traiteur',
  PRIMEUR = 'primeur',
  BOUCHERIE = 'boucherie',
  CHARCUTERIE = 'charcuterie',
  POISSONNERIE = 'poissonnerie',
  FROMAGERIE = 'fromagerie',
  CHOCOLATERIE = 'chocolaterie',
  GLACIERE = 'glaciere',
  PIZZERIA = 'pizzeria',
  FASTFOOD = 'fastFood',
  BIOLOGIQUE = 'biologique',
  VEGAN = 'vegan',
  AUTRE = 'autre',
}

// Labels en français pour chaque type
export const MerchantTypeLabels: Record<MerchantType, string> = {
  [MerchantType.RESTAURANT]: 'Restaurant',
  [MerchantType.BOULANGERIE]: 'Boulangerie',
  [MerchantType.PATISSERIE]: 'Pâtisserie',
  [MerchantType.SUPERMARCHE]: 'Supermarché',
  [MerchantType.EPICERIE]: 'Épicerie',
  [MerchantType.CAFE]: 'Café',
  [MerchantType.TRAITEUR]: 'Traiteur',
  [MerchantType.PRIMEUR]: 'Primeur',
  [MerchantType.BOUCHERIE]: 'Boucherie',
  [MerchantType.CHARCUTERIE]: 'Charcuterie',
  [MerchantType.POISSONNERIE]: 'Poissonnerie',
  [MerchantType.FROMAGERIE]: 'Fromagerie',
  [MerchantType.CHOCOLATERIE]: 'Chocolaterie',
  [MerchantType.GLACIERE]: 'Glacier',
  [MerchantType.PIZZERIA]: 'Pizzeria',
  [MerchantType.FASTFOOD]: 'Fast-food',
  [MerchantType.BIOLOGIQUE]: 'Bio/Biologique',
  [MerchantType.VEGAN]: 'Vegan',
  [MerchantType.AUTRE]: 'Autre',
};

// Statuts du marchand
export enum MerchantStatus {
  PENDING = 'pending',           // En attente de vérification
  VERIFIED = 'verified',         // Vérifié mais pas encore actif
  ACTIVE = 'active',             // Actif et opérationnel
  SUSPENDED = 'suspended',       // Suspendu
  INACTIVE = 'inactive',         // Inactif (temporairement fermé)
  REJECTED = 'rejected',         // Rejeté après vérification
}

// Niveaux de prix
export enum PriceLevel {
  BUDGET = 'budget',             // €
  MODERATE = 'moderate',         // €€
  EXPENSIVE = 'expensive',       // €€€
  LUXURY = 'luxury',             // €€€€
}

export const PriceLevelLabels: Record<PriceLevel, string> = {
  [PriceLevel.BUDGET]: '€ - Économique',
  [PriceLevel.MODERATE]: '€€ - Modéré',
  [PriceLevel.EXPENSIVE]: '€€€ - Cher',
  [PriceLevel.LUXURY]: '€€€€ - Luxe',
};

// Jours de la semaine
export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export const DayOfWeekLabels: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Lundi',
  [DayOfWeek.TUESDAY]: 'Mardi',
  [DayOfWeek.WEDNESDAY]: 'Mercredi',
  [DayOfWeek.THURSDAY]: 'Jeudi',
  [DayOfWeek.FRIDAY]: 'Vendredi',
  [DayOfWeek.SATURDAY]: 'Samedi',
  [DayOfWeek.SUNDAY]: 'Dimanche',
};

// Statuts de vérification
export enum VerificationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

