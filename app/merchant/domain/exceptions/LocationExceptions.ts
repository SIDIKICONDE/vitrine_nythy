/**
 * LocationExceptions - Exceptions liées à la géolocalisation
 */

/**
 * Géolocalisation invalide
 */
export class InvalidLocationException extends Error {
  constructor(message: string = 'Localisation invalide') {
    super(message);
    this.name = 'InvalidLocationException';
  }
}

/**
 * Service de géocodage non disponible
 */
export class GeocodingServiceUnavailableException extends Error {
  constructor(message: string = 'Service de géocodage non disponible') {
    super(message);
    this.name = 'GeocodingServiceUnavailableException';
  }
}

/**
 * Adresse introuvable
 */
export class AddressNotFoundException extends Error {
  constructor(message: string = 'Adresse introuvable') {
    super(message);
    this.name = 'AddressNotFoundException';
  }
}

