/**
 * Requête de recherche par proximité
 */

import { GeoLocation, GeoLocationValue } from '../value-objects/GeoLocation';
import { MerchantFilters, MerchantFiltersData } from './MerchantFilters';
import { SortBy } from '../enums/SortBy';

export interface SortOptions {
  sortBy: SortBy;
  ascending?: boolean;
}

export interface ProximitySearchQueryData {
  center: GeoLocation;
  radiusKm?: number;
  filters?: MerchantFilters | MerchantFiltersData;
  sort?: SortOptions;
  limit?: number;
  offset?: number;
}

export class ProximitySearchQuery {
  private _center: GeoLocationValue;

  constructor(
    center: GeoLocation | GeoLocationValue,
    public readonly radiusKm: number = 5.0,
    public readonly filters: MerchantFilters = MerchantFilters.empty(),
    public readonly sort: SortOptions = { sortBy: SortBy.DISTANCE, ascending: true },
    public readonly limit: number = 20,
    public readonly offset: number = 0
  ) {
    if (center instanceof GeoLocationValue) {
      this._center = center;
    } else {
      this._center = GeoLocationValue.from(center);
    }
  }

  /**
   * Factory: Recherche simple
   */
  static simple(center: GeoLocation | GeoLocationValue, radiusKm: number = 5.0): ProximitySearchQuery {
    return new ProximitySearchQuery(center, radiusKm);
  }

  /**
   * Factory: Recherche urgente (rayon réduit)
   */
  static urgent(center: GeoLocation | GeoLocationValue, radiusKm: number = 3.0): ProximitySearchQuery {
    return new ProximitySearchQuery(center, radiusKm);
  }

  /**
   * Factory: Depuis un objet
   */
  static from(data: ProximitySearchQueryData): ProximitySearchQuery {
    let filters: MerchantFilters;
    if (data.filters) {
      // Si c'est déjà une instance de MerchantFilters, l'utiliser directement
      if (data.filters instanceof MerchantFilters) {
        filters = data.filters;
      } else {
        // Sinon, créer depuis les données
        filters = MerchantFilters.from(data.filters);
      }
    } else {
      filters = MerchantFilters.empty();
    }

    return new ProximitySearchQuery(
      data.center,
      data.radiusKm,
      filters,
      data.sort || { sortBy: SortBy.DISTANCE, ascending: true },
      data.limit,
      data.offset
    );
  }

  /**
   * Centre de recherche
   */
  get center(): GeoLocationValue {
    return this._center;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): Omit<ProximitySearchQueryData, 'filters'> & { filters?: MerchantFiltersData } {
    return {
      center: this._center.toJSON(),
      radiusKm: this.radiusKm,
      filters: this.filters.isEmpty ? undefined : this.filters.toJSON(),
      sort: this.sort,
      limit: this.limit,
      offset: this.offset,
    };
  }
}

