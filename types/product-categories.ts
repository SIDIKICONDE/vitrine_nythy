/**
 * Catégories de produits anti-gaspillage
 * Aligné sur le domaine Flutter (lib/core/domain/enums/product_categories.dart)
 */

export enum ProductCategory {
  // ALIMENTATION DE BASE
  BAKERY = 'bakery',
  CEREALS_AND_STARCHES = 'cerealsAndStarches',
  MEAT_AND_POULTRY = 'meatAndPoultry',
  FISH_AND_SEAFOOD = 'fishAndSeafood',
  DAIRY_PRODUCTS = 'dairyProducts',
  EGGS = 'eggs',

  // FRUITS ET LÉGUMES
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',

  // PRODUITS FRAIS ET SPÉCIALITÉS
  FRESH_PRODUCTS = 'freshProducts',
  ORGANIC_VEGAN = 'organicVegan',
  RESTAURANT_MEALS = 'restaurantMeals',
  CATERING_EVENTS = 'cateringEvents',

  // AUTRES CATÉGORIES ALIMENTAIRES
  NUTS_AND_SEEDS = 'nutsAndSeeds',
  LEGUMES = 'legumes',
  OILS_AND_FATS = 'oilsAndFats',
  SWEETENERS = 'sweeteners',
  CONDIMENTS_AND_SPICES = 'condimentsAndSpices',
  BEVERAGES = 'beverages',
  DESSERTS_AND_CONFECTIONERY = 'dessertsAndConfectionery',
  SNACKS_AND_APPETIZERS = 'snacksAndAppetizers',

  // CATÉGORIES SPÉCIALES
  PROCESSED_FOODS = 'processedFoods',
  HERBS = 'herbs',
  MUSHROOMS = 'mushrooms',
  FROZEN_FOODS = 'frozenFoods',

  // DIVERS
  OTHER = 'other',
}

export const ProductCategoryLabels: Record<ProductCategory, string> = {
  [ProductCategory.BAKERY]: '🥖 Boulangerie & Pâtisserie',
  [ProductCategory.CEREALS_AND_STARCHES]: '🍞 Céréales & Féculents',
  [ProductCategory.MEAT_AND_POULTRY]: '🥩 Viandes & Volailles',
  [ProductCategory.FISH_AND_SEAFOOD]: '🐟 Poissons & Fruits de mer',
  [ProductCategory.DAIRY_PRODUCTS]: '🥛 Produits Laitiers',
  [ProductCategory.EGGS]: '🥚 Œufs',
  [ProductCategory.VEGETABLES]: '🥕 Légumes',
  [ProductCategory.FRUITS]: '🍎 Fruits',
  [ProductCategory.FRESH_PRODUCTS]: '🥬 Produits Frais',
  [ProductCategory.ORGANIC_VEGAN]: '🌱 Bio & Végan',
  [ProductCategory.RESTAURANT_MEALS]: '🍽️ Restauration & Plats',
  [ProductCategory.CATERING_EVENTS]: '🎉 Événementiel & Traiteur',
  [ProductCategory.NUTS_AND_SEEDS]: '🥜 Noix & Graines',
  [ProductCategory.LEGUMES]: '🫘 Légumineuses',
  [ProductCategory.OILS_AND_FATS]: '🫒 Huiles & Matières grasses',
  [ProductCategory.SWEETENERS]: '🍯 Édulcorants',
  [ProductCategory.CONDIMENTS_AND_SPICES]: '🧂 Condiments & Épices',
  [ProductCategory.BEVERAGES]: '☕ Boissons',
  [ProductCategory.DESSERTS_AND_CONFECTIONERY]: '🍰 Desserts & Confiseries',
  [ProductCategory.SNACKS_AND_APPETIZERS]: '🍿 Snacks & En-cas',
  [ProductCategory.PROCESSED_FOODS]: '🥫 Aliments Transformés',
  [ProductCategory.HERBS]: '🌿 Herbes Aromatiques',
  [ProductCategory.MUSHROOMS]: '🍄 Champignons',
  [ProductCategory.FROZEN_FOODS]: '🧊 Surgelés',
  [ProductCategory.OTHER]: '🏷️ Autres / Divers',
};

/**
 * Catégories principales pour l'affichage rapide
 */
export const MAIN_CATEGORIES: ProductCategory[] = [
  ProductCategory.BAKERY,
  ProductCategory.FRUITS,
  ProductCategory.VEGETABLES,
  ProductCategory.FRESH_PRODUCTS,
  ProductCategory.RESTAURANT_MEALS,
  ProductCategory.ORGANIC_VEGAN,
  ProductCategory.MEAT_AND_POULTRY,
  ProductCategory.FISH_AND_SEAFOOD,
  ProductCategory.DAIRY_PRODUCTS,
  ProductCategory.BEVERAGES,
  ProductCategory.DESSERTS_AND_CONFECTIONERY,
];

/**
 * Obtenir le label d'une catégorie
 */
export function getCategoryLabel(category: ProductCategory): string {
  return ProductCategoryLabels[category] || category;
}

/**
 * Obtenir toutes les catégories triées par nom
 */
export function getAllCategories(): ProductCategory[] {
  return Object.values(ProductCategory).sort((a, b) =>
    getCategoryLabel(a).localeCompare(getCategoryLabel(b))
  );
}

