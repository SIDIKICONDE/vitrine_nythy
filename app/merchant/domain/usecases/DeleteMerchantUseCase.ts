/**
 * DeleteMerchantUseCase - Supprimer un commerçant
 */

import { MerchantRepository } from '../repositories/MerchantRepository';

export class DeleteMerchantUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string): Promise<void> {
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    // Vérifier que le commerçant existe
    const merchant = await this.merchantRepository.getMerchantById(merchantId);
    if (!merchant) {
      throw new Error(`Merchant with ID ${merchantId} not found`);
    }

    await this.merchantRepository.deleteMerchant(merchantId);
  }
}

