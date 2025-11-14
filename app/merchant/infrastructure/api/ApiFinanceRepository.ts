/**
 * ApiFinanceRepository - Implémentation API du FinanceRepository
 * Connecte au backend Firebase via les API routes Next.js
 * 
 * ✅ ARCHITECTURE DDD
 * - Implémentation concrète du port FinanceRepository
 * - Appels API vers les routes Next.js
 */

import { FinanceSummary } from '../../domain/entities/FinanceSummary';
import { Transaction } from '../../domain/entities/Transaction';
import { FinanceRepository } from '../../domain/repositories/FinanceRepository';

export class ApiFinanceRepository implements FinanceRepository {
  private merchantId: string;

  constructor(merchantId: string) {
    this.merchantId = merchantId;
  }

  async getFinanceSummary(
    merchantId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all',
    startDate?: Date,
    endDate?: Date
  ): Promise<FinanceSummary> {
    try {
      console.log('💰 [API] Récupération résumé financier:', period);

      const params = new URLSearchParams({
        period,
      });

      if (startDate) params.append('startDate', startDate.toISOString());
      if (endDate) params.append('endDate', endDate.toISOString());

      const response = await fetch(`/api/merchant/${merchantId}/finances/summary?${params}`);
      const result = await response.json();

      console.log('📊 [ApiFinanceRepository] Réponse API complète:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        result: result
      });

      if (!response.ok || !result.success) {
        const errorMsg = result.message || result.error || 'Erreur lors de la récupération du résumé financier';
        const errorDetails = result.details || result.error || '';
        const errorCode = result.error || 'UNKNOWN_ERROR';

        // Log structuré pour éviter les objets vides
        console.error('❌ [ApiFinanceRepository] Erreur API finances détaillée:',
          `Status: ${response.status}`,
          `Message: ${errorMsg}`,
          errorDetails ? `Détails: ${errorDetails}` : '',
          errorCode ? `Code: ${errorCode}` : ''
        );

        // Message d'erreur plus explicite selon le code d'erreur
        if (errorCode === 'NO_SESSION' || errorCode === 'UNAUTHENTICATED') {
          throw new Error('Vous devez être connecté pour accéder aux données financières');
        } else if (errorCode === 'INVALID_MERCHANT_ID') {
          throw new Error('Commerce non trouvé ou invalide');
        } else if (errorCode === 'PERMISSION_DENIED') {
          throw new Error('Vous n\'avez pas l\'autorisation d\'accéder à ces données');
        }

        throw new Error(`${errorMsg}${errorDetails ? ` - Détails: ${errorDetails}` : ''}`);
      }

      // Convertir les données API en entité FinanceSummary
      return FinanceSummary.from({
        ...result.summary,
        startDate: new Date(result.summary.startDate),
        endDate: new Date(result.summary.endDate),
        generatedAt: new Date(result.summary.generatedAt),
        nextPayoutDate: result.summary.nextPayoutDate ? new Date(result.summary.nextPayoutDate) : undefined,
        revenueByDay: result.summary.revenueByDay?.map((item: any) => ({
          ...item,
          date: new Date(item.date),
        })) || [],
        payoutHistory: result.summary.payoutHistory || [],
      });
    } catch (error) {
      console.error('❌ [ApiFinanceRepository] Erreur getFinanceSummary:', error);
      throw error;
    }
  }

  async getTransactions(
    merchantId: string,
    filters?: {
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    try {
      console.log('💳 [API] Récupération transactions');

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());

      const response = await fetch(`/api/merchant/${merchantId}/finances/transactions?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors de la récupération des transactions');
      }

      // Convertir les données API en entités Transaction
      return result.transactions.map((txn: any) => Transaction.from({
        ...txn,
        createdAt: new Date(txn.createdAt),
        processedAt: txn.processedAt ? new Date(txn.processedAt) : undefined,
        completedAt: txn.completedAt ? new Date(txn.completedAt) : undefined,
      }));
    } catch (error) {
      console.error('❌ [ApiFinanceRepository] Erreur getTransactions:', error);
      throw error;
    }
  }

  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      console.log('💳 [API] Récupération transaction:', transactionId);

      const response = await fetch(`/api/merchant/${this.merchantId}/finances/transactions/${transactionId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        if (response.status === 404) return null;
        throw new Error(result.message || 'Erreur lors de la récupération de la transaction');
      }

      return Transaction.from({
        ...result.transaction,
        createdAt: new Date(result.transaction.createdAt),
        processedAt: result.transaction.processedAt ? new Date(result.transaction.processedAt) : undefined,
        completedAt: result.transaction.completedAt ? new Date(result.transaction.completedAt) : undefined,
      });
    } catch (error) {
      console.error('❌ [ApiFinanceRepository] Erreur getTransactionById:', error);
      throw error;
    }
  }

  async getPayouts(
    merchantId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<Transaction[]> {
    try {
      console.log('💸 [API] Récupération versements');

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      const response = await fetch(`/api/merchant/${merchantId}/finances/payouts?${params}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors de la récupération des versements');
      }

      // Convertir les données API en entités Transaction
      return result.payouts.map((payout: any) => Transaction.from({
        ...payout,
        createdAt: new Date(payout.createdAt),
        scheduledDate: payout.scheduledDate ? new Date(payout.scheduledDate) : undefined,
        processedAt: payout.processedAt ? new Date(payout.processedAt) : undefined,
        completedAt: payout.completedAt ? new Date(payout.completedAt) : undefined,
      }));
    } catch (error) {
      console.error('❌ [ApiFinanceRepository] Erreur getPayouts:', error);
      throw error;
    }
  }

  async getAvailableBalance(merchantId: string): Promise<number> {
    try {
      // Récupérer le summary pour obtenir le balance disponible
      const summary = await this.getFinanceSummary(merchantId, 'all');
      return summary.availableBalance.amountMinor;
    } catch (error) {
      console.error('❌ [ApiFinanceRepository] Erreur getAvailableBalance:', error);
      throw error;
    }
  }
}

export function createApiFinanceRepository(merchantId: string): FinanceRepository {
  return new ApiFinanceRepository(merchantId);
}

