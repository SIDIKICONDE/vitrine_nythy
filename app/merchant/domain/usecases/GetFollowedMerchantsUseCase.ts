/**
 * GetFollowedMerchantsUseCase - Obtenir les commerçants suivis par un utilisateur
 */

import { Merchant } from '../entities/Merchant';
import { MerchantRepository } from '../repositories/MerchantRepository';

export class GetFollowedMerchantsUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(userId: string): Promise<Merchant[]> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }

    return await this.merchantRepository.getFollowedMerchants(userId);
  }
}

