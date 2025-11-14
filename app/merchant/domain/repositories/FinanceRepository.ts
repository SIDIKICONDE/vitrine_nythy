/**
 * Repository Interface pour les Finances
 * 
 * ✅ ARCHITECTURE DDD - Port (Hexagonal Architecture)
 * - Interface abstraite du domaine
 * - Découplage domaine/infrastructure
 */

import { Transaction } from '../entities/Transaction';
import { FinanceSummary } from '../entities/FinanceSummary';

export interface FinanceRepository {
  /**
   * Récupère le résumé financier d'un commerçant
   * @param merchantId ID du commerçant
   * @param period Période (daily, weekly, monthly, yearly, all)
   * @param startDate Date de début (optionnelle)
   * @param endDate Date de fin (optionnelle)
   * @returns Le résumé financier
   */
  getFinanceSummary(
    merchantId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all',
    startDate?: Date,
    endDate?: Date
  ): Promise<FinanceSummary>;

  /**
   * Récupère les transactions d'un commerçant
   * @param merchantId ID du commerçant
   * @param filters Filtres (type, status, date, etc.)
   * @param limit Nombre maximum de résultats
   * @param offset Offset pour la pagination
   * @returns Liste des transactions
   */
  getTransactions(
    merchantId: string,
    filters?: {
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit?: number,
    offset?: number
  ): Promise<Transaction[]>;

  /**
   * Récupère une transaction par son ID
   * @param transactionId ID de la transaction
   * @returns La transaction ou null si introuvable
   */
  getTransactionById(transactionId: string): Promise<Transaction | null>;

  /**
   * Récupère l'historique des versements
   * @param merchantId ID du commerçant
   * @param limit Nombre maximum de résultats
   * @param offset Offset pour la pagination
   * @returns Liste des versements
   */
  getPayouts(
    merchantId: string,
    limit?: number,
    offset?: number
  ): Promise<Transaction[]>;

  /**
   * Récupère le solde disponible d'un commerçant
   * @param merchantId ID du commerçant
   * @returns Le solde disponible
   */
  getAvailableBalance(merchantId: string): Promise<number>; // En centimes
}

