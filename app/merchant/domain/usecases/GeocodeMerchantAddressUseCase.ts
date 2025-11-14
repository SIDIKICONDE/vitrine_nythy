/**
 * GeocodeMerchantAddressUseCase - Géocoder l'adresse d'un commerçant
 */

import { GeoLocationValue } from '../value-objects/GeoLocation';

export interface GeocodingService {
  geocode(address: string): Promise<GeoLocationValue>;
}

export class GeocodeMerchantAddressUseCase {
  constructor(private readonly geocodingService: GeocodingService) {}

  async execute(address: string): Promise<GeoLocationValue> {
    if (!address || address.trim() === '') {
      throw new Error('Address is required');
    }

    const location = await this.geocodingService.geocode(address);

    if (!location) {
      throw new Error(`Unable to geocode address: ${address}`);
    }

    return location;
  }
}

