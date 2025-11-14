/**
 * Value Object: GeoLocation
 * Géolocalisation avec validation
 */

export interface GeoLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyMeters?: number;
}

export class GeoLocationValue {
  private constructor(
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly accuracyMeters?: number
  ) {
    this.validate();
  }

  /**
   * Factory method avec validation
   */
  static validated(
    latitude: number,
    longitude: number,
    accuracyMeters?: number
  ): GeoLocationValue {
    return new GeoLocationValue(latitude, longitude, accuracyMeters);
  }

  /**
   * Créer depuis un objet GeoLocation
   */
  static from(location: GeoLocation): GeoLocationValue {
    return new GeoLocationValue(
      location.latitude,
      location.longitude,
      location.accuracyMeters
    );
  }

  /**
   * Validation des coordonnées
   */
  private validate(): void {
    if (this.latitude < -90 || this.latitude > 90) {
      throw new Error('Latitude doit être entre -90 et 90');
    }
    if (this.longitude < -180 || this.longitude > 180) {
      throw new Error('Longitude doit être entre -180 et 180');
    }
    if (this.accuracyMeters !== undefined && this.accuracyMeters < 0) {
      throw new Error('La précision doit être positive');
    }
  }

  /**
   * Vérifier si la localisation est valide
   */
  isValid(): boolean {
    try {
      this.validate();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Format "lat,lng"
   */
  get coordinates(): string {
    return `${this.latitude},${this.longitude}`;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): GeoLocation {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
      accuracyMeters: this.accuracyMeters,
    };
  }
}

