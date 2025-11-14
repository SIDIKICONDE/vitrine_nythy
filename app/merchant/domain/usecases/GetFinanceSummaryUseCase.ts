/**
 * Use Case: GetFinanceSummaryUseCase
 * Récupérer le résumé financier d'un commerçant
 * 
 * ✅ ARCHITECTURE DDD
 * - Validation des inputs
 * - Orchestration du repository
 * - Règles métier
 */

import { FinanceSummary } from '../entities/FinanceSummary';
import { FinanceRepository } from '../repositories/FinanceRepository';
import { MerchantNotFoundException } from '../exceptions/MerchantExceptions';

export class GetFinanceSummaryUseCase {
  constructor(
    private readonly financeRepository: FinanceRepository
  ) {}

  /**
   * Exécute la récupération du résumé financier
   * @param merchantId ID du commerçant
   * @param period Période (daily, weekly, monthly, yearly, all)
   * @param startDate Date de début (optionnelle)
   * @param endDate Date de fin (optionnelle)
   * @returns Le résumé financier
   * @throws MerchantNotFoundException Si le commerçant n'existe pas
   */
  async execute(
    merchantId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all' = 'monthly',
    startDate?: Date,
    endDate?: Date
  ): Promise<FinanceSummary> {
    // === 1. VALIDATION DES INPUTS ===
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    // Validation de la période
    const validPeriods = ['daily', 'weekly', 'monthly', 'yearly', 'all'];
    if (!validPeriods.includes(period)) {
      throw new Error(`Invalid period. Must be one of: ${validPeriods.join(', ')}`);
    }

    // Validation des dates
    if (startDate && endDate && startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    // === 2. RÉCUPÉRATION DU RÉSUMÉ ===
    try {
      const summary = await this.financeRepository.getFinanceSummary(
        merchantId,
        period,
        startDate,
        endDate
      );

      return summary;
    } catch (error) {
      if (error instanceof MerchantNotFoundException) {
        throw error;
      }
      throw new Error(`Failed to get finance summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

