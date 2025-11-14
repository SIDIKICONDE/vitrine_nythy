/**
 * Filtres de recherche pour les commerçants
 */

import { MerchantType } from '../enums/MerchantType';
import { PriceLevel } from '../enums/PriceLevel';
import { DietaryTag } from '../enums/DietaryTag';

export interface MerchantFiltersData {
  query?: string;
  types?: MerchantType[];
  minRating?: number;
  hasAvailableProducts?: boolean;
  maxDistanceKm?: number;
  dietaryTags?: DietaryTag[];
  priceLevels?: PriceLevel[];
  isSurpriseBoxOnly?: boolean;
  minDiscount?: number;
  categories?: string[];
}

export class MerchantFilters {
  constructor(
    public readonly query?: string,
    public readonly types: Set<MerchantType> = new Set(),
    public readonly minRating?: number,
    public readonly hasAvailableProducts?: boolean,
    public readonly maxDistanceKm?: number,
    public readonly dietaryTags: Set<DietaryTag> = new Set(),
    public readonly priceLevels: Set<PriceLevel> = new Set(),
    public readonly isSurpriseBoxOnly?: boolean,
    public readonly minDiscount?: number,
    public readonly categories: Set<string> = new Set()
  ) {}

  /**
   * Factory: Filtres vides
   */
  static empty(): MerchantFilters {
    return new MerchantFilters();
  }

  /**
   * Factory: Recherche à proximité
   */
  static nearby(maxDistanceKm: number): MerchantFilters {
    return new MerchantFilters(undefined, new Set(), undefined, undefined, maxDistanceKm);
  }

  /**
   * Factory: Par type
   */
  static byType(type: MerchantType): MerchantFilters {
    return new MerchantFilters(undefined, new Set([type]));
  }

  /**
   * Factory: Paniers mystère
   */
  static surpriseBoxes(): MerchantFilters {
    return new MerchantFilters(undefined, new Set(), undefined, undefined, undefined, new Set(), new Set(), true);
  }

  /**
   * Factory: Depuis un objet
   */
  static from(data: MerchantFiltersData): MerchantFilters {
    return new MerchantFilters(
      data.query,
      data.types ? new Set(data.types) : new Set(),
      data.minRating,
      data.hasAvailableProducts,
      data.maxDistanceKm,
      data.dietaryTags ? new Set(data.dietaryTags) : new Set(),
      data.priceLevels ? new Set(data.priceLevels) : new Set(),
      data.isSurpriseBoxOnly,
      data.minDiscount,
      data.categories ? new Set(data.categories) : new Set()
    );
  }

  /**
   * Créer une copie avec modifications
   */
  copyWith(updates: Partial<MerchantFiltersData>): MerchantFilters {
    return new MerchantFilters(
      updates.query !== undefined ? updates.query : this.query,
      updates.types ? new Set(updates.types) : this.types,
      updates.minRating !== undefined ? updates.minRating : this.minRating,
      updates.hasAvailableProducts !== undefined ? updates.hasAvailableProducts : this.hasAvailableProducts,
      updates.maxDistanceKm !== undefined ? updates.maxDistanceKm : this.maxDistanceKm,
      updates.dietaryTags ? new Set(updates.dietaryTags) : this.dietaryTags,
      updates.priceLevels ? new Set(updates.priceLevels) : this.priceLevels,
      updates.isSurpriseBoxOnly !== undefined ? updates.isSurpriseBoxOnly : this.isSurpriseBoxOnly,
      updates.minDiscount !== undefined ? updates.minDiscount : this.minDiscount,
      updates.categories ? new Set(updates.categories) : this.categories
    );
  }

  /**
   * Aucun filtre actif
   */
  get isEmpty(): boolean {
    return (
      !this.query &&
      this.types.size === 0 &&
      this.minRating === undefined &&
      this.hasAvailableProducts === undefined &&
      this.maxDistanceKm === undefined &&
      this.dietaryTags.size === 0 &&
      this.priceLevels.size === 0 &&
      this.isSurpriseBoxOnly === undefined &&
      this.minDiscount === undefined &&
      this.categories.size === 0
    );
  }

  /**
   * Nombre de filtres actifs
   */
  get activeFilterCount(): number {
    let count = 0;
    if (this.query) count++;
    if (this.types.size > 0) count++;
    if (this.minRating !== undefined) count++;
    if (this.hasAvailableProducts !== undefined) count++;
    if (this.maxDistanceKm !== undefined) count++;
    if (this.dietaryTags.size > 0) count++;
    if (this.priceLevels.size > 0) count++;
    if (this.isSurpriseBoxOnly !== undefined) count++;
    if (this.minDiscount !== undefined) count++;
    if (this.categories.size > 0) count++;
    return count;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): MerchantFiltersData {
    return {
      query: this.query,
      types: this.types.size > 0 ? Array.from(this.types) : undefined,
      minRating: this.minRating,
      hasAvailableProducts: this.hasAvailableProducts,
      maxDistanceKm: this.maxDistanceKm,
      dietaryTags: this.dietaryTags.size > 0 ? Array.from(this.dietaryTags) : undefined,
      priceLevels: this.priceLevels.size > 0 ? Array.from(this.priceLevels) : undefined,
      isSurpriseBoxOnly: this.isSurpriseBoxOnly,
      minDiscount: this.minDiscount,
      categories: this.categories.size > 0 ? Array.from(this.categories) : undefined,
    };
  }
}

