/**
 * Use Case: GetTransactionsUseCase
 * Récupérer les transactions d'un commerçant
 * 
 * ✅ ARCHITECTURE DDD
 * - Validation des inputs
 * - Orchestration du repository
 * - Filtrage et pagination
 */

import { Transaction, TransactionType, TransactionStatus } from '../entities/Transaction';
import { FinanceRepository } from '../repositories/FinanceRepository';

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  startDate?: Date;
  endDate?: Date;
}

export class GetTransactionsUseCase {
  constructor(
    private readonly financeRepository: FinanceRepository
  ) {}

  /**
   * Exécute la récupération des transactions
   * @param merchantId ID du commerçant
   * @param filters Filtres optionnels
   * @param limit Nombre maximum de résultats (défaut: 50)
   * @param offset Offset pour la pagination (défaut: 0)
   * @returns Liste des transactions
   */
  async execute(
    merchantId: string,
    filters?: TransactionFilters,
    limit: number = 50,
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

    // Validation des dates
    if (filters?.startDate && filters?.endDate && filters.startDate >= filters.endDate) {
      throw new Error('Start date must be before end date');
    }

    // === 2. RÉCUPÉRATION DES TRANSACTIONS ===
    try {
      const transactions = await this.financeRepository.getTransactions(
        merchantId,
        {
          type: filters?.type,
          status: filters?.status,
          startDate: filters?.startDate,
          endDate: filters?.endDate,
        },
        limit,
        offset
      );

      return transactions;
    } catch (error) {
      throw new Error(`Failed to get transactions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

