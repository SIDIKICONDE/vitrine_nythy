/**
 * Use Case: SearchNearbyMerchantsUseCase
 * Rechercher des commerçants à proximité
 */

import { Merchant } from '../entities/Merchant';
import { MerchantRepository } from '../repositories/MerchantRepository';
import { ProximitySearchQuery } from '../filters/ProximitySearchQuery';

export class SearchNearbyMerchantsUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(query: ProximitySearchQuery): Promise<Merchant[]> {
    return this.merchantRepository.searchNearby(query);
  }
}

