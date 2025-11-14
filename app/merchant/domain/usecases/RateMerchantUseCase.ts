/**
 * RateMerchantUseCase - Noter un commerçant
 */

import { MerchantRepository } from '../repositories/MerchantRepository';

export interface RatingData {
  userId: string;
  merchantId: string;
  rating: number; // 1-5
  comment?: string;
}

export class RateMerchantUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(ratingData: RatingData): Promise<void> {
    // Validation
    if (!ratingData.userId || ratingData.userId.trim() === '') {
      throw new Error('User ID is required');
    }
    if (!ratingData.merchantId || ratingData.merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }
    if (ratingData.rating < 1 || ratingData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Vérifier que le commerçant existe
    const merchant = await this.merchantRepository.getMerchantById(ratingData.merchantId);
    if (!merchant) {
      throw new Error(`Merchant with ID ${ratingData.merchantId} not found`);
    }

    await this.merchantRepository.rateMerchant(
      ratingData.userId,
      ratingData.merchantId,
      ratingData.rating,
      ratingData.comment
    );
  }
}

