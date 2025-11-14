/**
 * GetMerchantStatisticsUseCase - Obtenir les statistiques d'impact anti-gaspillage
 */

import { MerchantRepository } from '../repositories/MerchantRepository';

export interface MerchantStatistics {
  merchantId: string;
  totalItemsSaved: number;
  totalCO2Saved: number; // en kg
  totalMoneyDistributed: number; // en centimes
  totalCustomers: number;
  impactScore: number; // 0-100
  generatedAt: Date;
}

export class GetMerchantStatisticsUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string): Promise<MerchantStatistics> {
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    return await this.merchantRepository.getMerchantStatistics(merchantId);
  }
}

