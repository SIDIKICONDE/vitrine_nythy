/**
 * Use Case: GetDashboardSummaryUseCase
 * Obtenir le résumé du dashboard marchand
 */

import { DashboardSummary } from '../entities/DashboardSummary';
import { MerchantRepository } from '../repositories/MerchantRepository';
import { MerchantNotFoundException } from '../exceptions/MerchantExceptions';

export class GetDashboardSummaryUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string): Promise<DashboardSummary> {
    // Vérifier que le commerçant existe
    const merchant = await this.merchantRepository.getMerchantById(merchantId);
    if (!merchant) {
      throw new MerchantNotFoundException(`Commerçant introuvable: ${merchantId}`);
    }

    // TODO: Implémenter la récupération des statistiques depuis le repository
    // Pour l'instant, retourner un résumé vide
    return DashboardSummary.from({
      totalRevenue: 0,
      todayRevenue: 0,
      activeProducts: 0,
      totalOrders: 0,
      pendingOrders: 0,
      averageRating: 0,
      totalReviews: 0,
    });
  }
}

