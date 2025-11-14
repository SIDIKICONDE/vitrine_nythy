/**
 * ProductInfoSection - Section informations produit
 * Aligné sur Flutter (product_info_section.dart)
 */

'use client';

import { ProductCategory, ProductCategoryLabels, getAllCategories } from '@/types/product-categories';
import CategorySelect from '../CategorySelect';

interface ProductInfoSectionProps {
  title: string;
  description: string;
  category: string;
  subcategory: string | null;
  isSurpriseBox: boolean;
  surpriseDescription: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
  onSubcategoryChange: (category: string | null) => void;
  onSurpriseBoxChange: (value: boolean) => void;
  onSurpriseDescriptionChange: (value: string) => void;
}

/**
 * Obtient les sous-catégories selon la catégorie principale sélectionnée
 * Aligné sur Flutter (_getSubcategories)
 */
function getSubcategories(mainCategory: ProductCategory): ProductCategory[] {
  switch (mainCategory) {
    case ProductCategory.BAKERY:
      return [
        ProductCategory.DESSERTS_AND_CONFECTIONERY,
        ProductCategory.CEREALS_AND_STARCHES,
        ProductCategory.SNACKS_AND_APPETIZERS,
      ];
    case ProductCategory.RESTAURANT_MEALS:
      return [
        ProductCategory.PROCESSED_FOODS,
        ProductCategory.SNACKS_AND_APPETIZERS,
        ProductCategory.FRESH_PRODUCTS,
      ];
    case ProductCategory.VEGETABLES:
      return [
        ProductCategory.FRUITS,
        ProductCategory.HERBS,
        ProductCategory.MUSHROOMS,
      ];
    case ProductCategory.FRESH_PRODUCTS:
      return [
        ProductCategory.MEAT_AND_POULTRY,
        ProductCategory.FISH_AND_SEAFOOD,
        ProductCategory.DAIRY_PRODUCTS,
        ProductCategory.EGGS,
      ];
    case ProductCategory.ORGANIC_VEGAN:
      return [
        ProductCategory.LEGUMES,
        ProductCategory.NUTS_AND_SEEDS,
        ProductCategory.OILS_AND_FATS,
        ProductCategory.SWEETENERS,
      ];
    case ProductCategory.MEAT_AND_POULTRY:
      return [ProductCategory.FISH_AND_SEAFOOD, ProductCategory.EGGS];
    case ProductCategory.CATERING_EVENTS:
      return [
        ProductCategory.BEVERAGES,
        ProductCategory.SNACKS_AND_APPETIZERS,
        ProductCategory.DESSERTS_AND_CONFECTIONERY,
      ];
    case ProductCategory.CEREALS_AND_STARCHES:
      return [ProductCategory.BAKERY, ProductCategory.NUTS_AND_SEEDS];
    case ProductCategory.FISH_AND_SEAFOOD:
      return [ProductCategory.MEAT_AND_POULTRY, ProductCategory.EGGS];
    case ProductCategory.DAIRY_PRODUCTS:
      return [ProductCategory.EGGS, ProductCategory.OILS_AND_FATS];
    case ProductCategory.FRUITS:
      return [ProductCategory.VEGETABLES, ProductCategory.NUTS_AND_SEEDS];
    case ProductCategory.BEVERAGES:
      return [
        ProductCategory.SNACKS_AND_APPETIZERS,
        ProductCategory.DESSERTS_AND_CONFECTIONERY,
      ];
    case ProductCategory.DESSERTS_AND_CONFECTIONERY:
      return [ProductCategory.BAKERY, ProductCategory.SNACKS_AND_APPETIZERS];
    case ProductCategory.PROCESSED_FOODS:
      return [
        ProductCategory.RESTAURANT_MEALS,
        ProductCategory.SNACKS_AND_APPETIZERS,
      ];
    case ProductCategory.SNACKS_AND_APPETIZERS:
      return [
        ProductCategory.BEVERAGES,
        ProductCategory.DESSERTS_AND_CONFECTIONERY,
      ];
    default:
      return [];
  }
}

export default function ProductInfoSection({
  title,
  description,
  category,
  subcategory,
  isSurpriseBox,
  surpriseDescription,
  onTitleChange,
  onDescriptionChange,
  onCategoryChange,
  onSubcategoryChange,
  onSurpriseBoxChange,
  onSurpriseDescriptionChange,
}: ProductInfoSectionProps) {
  const selectedCategory = category ? (category as ProductCategory) : null;
  const availableSubcategories = selectedCategory ? getSubcategories(selectedCategory) : [];

  return (
    <div className="liquid-glass relative z-20 p-6 space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">
        Informations produit
      </h3>

      {/* Switch Panier Mystère */}
      <div className="flex items-center justify-between p-4 bg-surface-hover rounded-lg border border-border">
        <div className="flex-1">
          <label className="text-sm font-medium text-foreground block">
            🎁 Panier surprise
          </label>
          <p className="text-xs text-foreground-muted mt-1">
            Contenu mystère pour lutter contre le gaspillage
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer ml-4">
          <input
            type="checkbox"
            checked={isSurpriseBox}
            onChange={(e) => onSurpriseBoxChange(e.target.checked)}
            className="sr-only peer"
          />
          <div className={`w-14 h-7 rounded-full transition-colors duration-200 ease-in-out relative ${isSurpriseBox ? 'bg-primary' : 'bg-gray-300'}`}>
            <div className={`absolute top-1 left-1 bg-white rounded-full h-5 w-5 transition-transform duration-200 ease-in-out shadow-md ${isSurpriseBox ? 'translate-x-7' : 'translate-x-0'}`}></div>
          </div>
        </label>
      </div>

      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Titre du produit *
        </label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            required
            placeholder={isSurpriseBox ? "Ex: Panier surprise du jour" : "Ex: Pain de campagne"}
            className="w-full px-4 py-3 pl-11 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
        </div>
      </div>

      {/* Description */}
      <div className={isSurpriseBox ? 'opacity-50' : ''}>
        <label className={`block text-sm font-medium mb-2 ${isSurpriseBox ? 'text-foreground-muted' : 'text-foreground'}`}>
          Description (optionnelle)
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={4}
          placeholder={isSurpriseBox ? "Non nécessaire pour panier surprise" : "Décrivez votre produit..."}
          disabled={isSurpriseBox}
          className={`w-full px-4 py-3 rounded-lg border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary ${isSurpriseBox ? 'bg-surface-muted cursor-not-allowed' : 'bg-surface'}`}
        />
        {isSurpriseBox && (
          <p className="text-xs text-foreground-muted mt-1">
            💡 Utilisez "Contenu du panier surprise" ci-dessous
          </p>
        )}
      </div>

      {/* Catégorie principale */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Catégorie principale {!isSurpriseBox && '*'} {isSurpriseBox && '(optionnelle)'}
        </label>
        <CategorySelect
          value={category}
          onChange={(cat) => {
            onCategoryChange(cat);
            // Réinitialiser la sous-catégorie si changement de catégorie principale
            onSubcategoryChange(null);
          }}
          required={!isSurpriseBox}
          categories={getAllCategories()}
        />
        <p className="text-xs text-foreground-muted mt-1">
          {isSurpriseBox ? '💡 Non obligatoire pour panier surprise (contenu varié)' : 'Type de produit alimentaire'}
        </p>
      </div>

      {/* Sous-catégorie (visible seulement si catégorie principale sélectionnée) */}
      {selectedCategory && availableSubcategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Sous-catégorie (optionnelle)
          </label>
          <CategorySelect
            value={subcategory || ''}
            onChange={(cat) => onSubcategoryChange(cat || null)}
            required={false}
            categories={availableSubcategories}
          />
          <p className="text-xs text-foreground-muted mt-1">
            {isSurpriseBox ? '💡 Optionnel pour panier surprise' : `Précisez le type de ${ProductCategoryLabels[selectedCategory].toLowerCase()}`}
          </p>
        </div>
      )}

      {/* Description surprise (si panier mystère) */}
      {isSurpriseBox && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Contenu du panier surprise
          </label>
          <textarea
            value={surpriseDescription}
            onChange={(e) => onSurpriseDescriptionChange(e.target.value)}
            rows={2}
            placeholder="Ex: Sélection de produits de boulangerie variés..."
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <p className="text-xs text-foreground-muted mt-1">
            Expliquez le contenu du panier surprise
          </p>
        </div>
      )}
    </div>
  );
}

