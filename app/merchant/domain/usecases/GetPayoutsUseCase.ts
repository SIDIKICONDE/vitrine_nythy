/**
 * Use Case: GetPayoutsUseCase
 * Récupérer l'historique des versements d'un commerçant
 * 
 * ✅ ARCHITECTURE DDD
 * - Validation des inputs
 * - Orchestration du repository
 * - Filtrage des versements
 */

import { Transaction } from '../entities/Transaction';
import { FinanceRepository } from '../repositories/FinanceRepository';

export class GetPayoutsUseCase {
  constructor(
    private readonly financeRepository: FinanceRepository
  ) {}

  /**
   * Exécute la récupération des versements
   * @param merchantId ID du commerçant
   * @param limit Nombre maximum de résultats (défaut: 20)
   * @param offset Offset pour la pagination (défaut: 0)
   * @returns Liste des versements
   */
  async execute(
    merchantId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Transaction[]> {
    // === 1. VALIDATION DES INPUTS ===
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    if (offset < 0) {
      throw new Error('Offset must be positive');
    }

    // === 2. RÉCUPÉRATION DES VERSEMENTS ===
    try {
      const payouts = await this.financeRepository.getPayouts(
        merchantId,
        limit,
        offset
      );

      return payouts;
    } catch (error) {
      throw new Error(`Failed to get payouts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

