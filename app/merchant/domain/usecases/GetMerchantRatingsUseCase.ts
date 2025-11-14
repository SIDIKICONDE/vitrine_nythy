/**
 * GetMerchantRatingsUseCase - Obtenir les avis d'un commerçant
 */

import { MerchantRepository } from '../repositories/MerchantRepository';

export interface MerchantRating {
  id: string;
  userId: string;
  merchantId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export class GetMerchantRatingsUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string, limit: number = 20, offset: number = 0): Promise<MerchantRating[]> {
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    const ratings = await this.merchantRepository.getMerchantRatings(merchantId);
    
    // Appliquer pagination et limite
    return ratings.slice(offset, offset + limit);
  }
}

