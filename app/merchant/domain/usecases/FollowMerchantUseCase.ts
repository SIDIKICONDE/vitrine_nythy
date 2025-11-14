/**
 * FollowMerchantUseCase - Suivre un commerçant
 */

import { MerchantRepository } from '../repositories/MerchantRepository';

export class FollowMerchantUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(userId: string, merchantId: string): Promise<void> {
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required');
    }
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    // Vérifier que le commerçant existe
    const merchant = await this.merchantRepository.getMerchantById(merchantId);
    if (!merchant) {
      throw new Error(`Merchant with ID ${merchantId} not found`);
    }

    await this.merchantRepository.followMerchant(userId, merchantId);
  }
}

