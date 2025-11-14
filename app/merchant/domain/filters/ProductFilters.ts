/**
 * Filtres de recherche pour les produits
 */

import { DietaryTag } from '../enums/DietaryTag';

export interface ProductFiltersData {
  query?: string;
  categories?: string[];
  dietaryTags?: DietaryTag[];
  allergenTags?: string[];
  minDiscount?: number;
  maxPrice?: number;
  isSurpriseBoxOnly?: boolean;
  availableNow?: boolean;
  pickupAfter?: Date;
  pickupBefore?: Date;
}

export class ProductFilters {
  constructor(
    public readonly query?: string,
    public readonly categories: Set<string> = new Set(),
    public readonly dietaryTags: Set<DietaryTag> = new Set(),
    public readonly allergenTags: Set<string> = new Set(),
    public readonly minDiscount?: number,
    public readonly maxPrice?: number,
    public readonly isSurpriseBoxOnly?: boolean,
    public readonly availableNow?: boolean,
    public readonly pickupAfter?: Date,
    public readonly pickupBefore?: Date
  ) {}

  /**
   * Factory: Recherche rapide
   */
  static quickSearch(query: string): ProductFilters {
    return new ProductFilters(query);
  }

  /**
   * Factory: Paniers mystère
   */
  static surpriseBoxes(): ProductFilters {
    return new ProductFilters(undefined, new Set(), new Set(), new Set(), undefined, undefined, true);
  }

  /**
   * Factory: Depuis un objet
   */
  static from(data: ProductFiltersData): ProductFilters {
    return new ProductFilters(
      data.query,
      data.categories ? new Set(data.categories) : new Set(),
      data.dietaryTags ? new Set(data.dietaryTags) : new Set(),
      data.allergenTags ? new Set(data.allergenTags) : new Set(),
      data.minDiscount,
      data.maxPrice,
      data.isSurpriseBoxOnly,
      data.availableNow,
      data.pickupAfter,
      data.pickupBefore
    );
  }

  /**
   * Aucun filtre actif
   */
  get isEmpty(): boolean {
    return (
      !this.query &&
      this.categories.size === 0 &&
      this.dietaryTags.size === 0 &&
      this.allergenTags.size === 0 &&
      this.minDiscount === undefined &&
      this.maxPrice === undefined &&
      this.isSurpriseBoxOnly === undefined &&
      this.availableNow === undefined &&
      this.pickupAfter === undefined &&
      this.pickupBefore === undefined
    );
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): ProductFiltersData {
    return {
      query: this.query,
      categories: this.categories.size > 0 ? Array.from(this.categories) : undefined,
      dietaryTags: this.dietaryTags.size > 0 ? Array.from(this.dietaryTags) : undefined,
      allergenTags: this.allergenTags.size > 0 ? Array.from(this.allergenTags) : undefined,
      minDiscount: this.minDiscount,
      maxPrice: this.maxPrice,
      isSurpriseBoxOnly: this.isSurpriseBoxOnly,
      availableNow: this.availableNow,
      pickupAfter: this.pickupAfter,
      pickupBefore: this.pickupBefore,
    };
  }
}

