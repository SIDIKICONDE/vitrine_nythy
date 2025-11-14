/**
 * Service de calcul de l'impact environnemental
 * Aligné sur Flutter (environmental_impact_calculator.dart)
 * Fournit des valeurs par défaut selon la catégorie
 */

/** Facteurs CO2 par catégorie (g CO2 / kg produit) */
const CO2_FACTORS: Record<string, number> = {
  bakery: 600,
  cerealsAndStarches: 500,
  meatAndPoultry: 6000,
  fishAndSeafood: 3000,
  dairyProducts: 1300,
  eggs: 1900,
  vegetables: 200,
  fruits: 150,
  freshProducts: 800,
  organicVegan: 400,
  restaurantMeals: 1000,
  cateringEvents: 1200,
  beverages: 300,
  dessertsAndConfectionery: 700,
  other: 500,
};

/** Poids moyens par catégorie (en grammes) */
const DEFAULT_WEIGHTS: Record<string, number> = {
  bakery: 400,              // Une baguette
  cerealsAndStarches: 500,  // Un paquet
  meatAndPoultry: 300,      // Une portion
  fishAndSeafood: 350,      // Un filet
  dairyProducts: 250,       // Un produit laitier
  eggs: 200,                // Quelques œufs
  vegetables: 500,          // Un sachet
  fruits: 600,              // Quelques fruits
  freshProducts: 400,       // Produits variés
  organicVegan: 350,        // Portion moyenne
  restaurantMeals: 450,     // Un plat
  cateringEvents: 600,      // Portion traiteur
  beverages: 500,           // Une bouteille
  dessertsAndConfectionery: 300, // Une pâtisserie
  other: 400,               // Valeur par défaut
};

export interface EnvironmentalDefaults {
  weightGrams: number;
  co2SavedGrams: number;
}

/**
 * Retourne les valeurs par défaut d'impact environnemental
 * selon la catégorie du produit
 */
export function getDefaultEnvironmentalImpact(
  category: string | null,
): EnvironmentalDefaults {
  if (!category) {
    return {
      weightGrams: DEFAULT_WEIGHTS.other,
      co2SavedGrams: calculateCo2(DEFAULT_WEIGHTS.other, 'other'),
    };
  }

  const weight = DEFAULT_WEIGHTS[category] || DEFAULT_WEIGHTS.other;
  const co2 = calculateCo2(weight, category);

  return {
    weightGrams: weight,
    co2SavedGrams: co2,
  };
}

/**
 * Calcule le CO2 économisé selon le poids et la catégorie
 */
export function calculateCo2(weightGrams: number, category: string | null): number {
  if (weightGrams <= 0) return 0;

  const weightKg = weightGrams / 1000;
  const factor = CO2_FACTORS[category || 'other'] || CO2_FACTORS.other;

  return Math.round(weightKg * factor); // Arrondir pour simplicité
}

/**
 * Retourne des valeurs suggérées en fonction de la catégorie
 * pour affichage dans les placeholders
 */
export function getSuggestedValues(category: string | null): {
  weightPlaceholder: string;
  co2Placeholder: string;
} {
  const defaults = getDefaultEnvironmentalImpact(category);

  return {
    weightPlaceholder: `Ex: ${defaults.weightGrams} (suggestion)`,
    co2Placeholder: `Ex: ${defaults.co2SavedGrams} (suggestion)`,
  };
}

