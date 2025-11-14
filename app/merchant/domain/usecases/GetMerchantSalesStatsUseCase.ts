/**
 * GetMerchantSalesStatsUseCase - Obtenir les statistiques de ventes
 */

import { MerchantSalesStats } from '../entities/MerchantSalesStats';
import { MerchantRepository } from '../repositories/MerchantRepository';

export class GetMerchantSalesStatsUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(
    merchantId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate?: Date,
    endDate?: Date
  ): Promise<MerchantSalesStats> {
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    return await this.merchantRepository.getMerchantSalesStats(merchantId, period, startDate, endDate);
  }
}

