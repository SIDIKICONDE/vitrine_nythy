/**
 * Hook: useFinance
 * Gestion des finances d'un commerçant avec architecture DDD
 * 
 * ✅ ARCHITECTURE DDD
 * - Utilise les Use Cases du domaine
 * - Séparation présentation/domaine
 * - État UI découplé du domaine
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FinanceRepository } from '../app/merchant/domain/repositories/FinanceRepository';
import { GetFinanceSummaryUseCase } from '../app/merchant/domain/usecases/GetFinanceSummaryUseCase';
import { GetTransactionsUseCase } from '../app/merchant/domain/usecases/GetTransactionsUseCase';
import { GetPayoutsUseCase } from '../app/merchant/domain/usecases/GetPayoutsUseCase';
import { FinanceSummary } from '../app/merchant/domain/entities/FinanceSummary';
import { Transaction } from '../app/merchant/domain/entities/Transaction';

export interface UseFinanceResult {
  // État
  summary: FinanceSummary | null;
  transactions: Transaction[];
  payouts: Transaction[];
  loading: boolean;
  error: string | null;

  // Actions
  refreshSummary: (period?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all') => Promise<void>;
  loadTransactions: (filters?: any) => Promise<void>;
  loadPayouts: () => Promise<void>;
  resetError: () => void;
}

export function useFinance(
  merchantId: string,
  financeRepository: FinanceRepository
): UseFinanceResult {
  // === État local ===
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payouts, setPayouts] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === Use Cases (mémorisés pour éviter les re-créations) ===
  const getFinanceSummaryUseCase = useMemo(
    () => new GetFinanceSummaryUseCase(financeRepository),
    [financeRepository]
  );
  const getTransactionsUseCase = useMemo(
    () => new GetTransactionsUseCase(financeRepository),
    [financeRepository]
  );
  const getPayoutsUseCase = useMemo(
    () => new GetPayoutsUseCase(financeRepository),
    [financeRepository]
  );

  // === Chargement initial ===
  useEffect(() => {
    // Ne charger que si on a un vrai merchantId (pas vide, pas 'temp', pas undefined, pas null)
    if (!merchantId || merchantId === 'temp' || merchantId === '' || merchantId === 'undefined' || merchantId === 'null' || !financeRepository) {
      console.log('⚠️ [useFinance] MerchantId invalide ou pas de repository, skip chargement:', { merchantId, hasRepository: !!financeRepository });
      setLoading(false);
      setSummary(null);
      setTransactions([]);
      setPayouts([]);
      return;
    }

    let cancelled = false;

    const loadInitialData = async () => {
      try {
        console.log('🔄 [useFinance] Début chargement données finances pour:', merchantId);
        setLoading(true);
        setError(null);

        // Charger le résumé financier avec gestion d'erreur silencieuse pour éviter les logs d'erreur vides
        try {
          const financeSummary = await getFinanceSummaryUseCase.execute(merchantId, 'monthly');
          if (!cancelled) {
            setSummary(financeSummary);
            console.log('✅ [useFinance] Summary chargé');
          }
        } catch (summaryError) {
          // Gérer les erreurs d'authentification ou d'autorisation sans les propager
          const summaryErrorMsg = summaryError instanceof Error ? summaryError.message : String(summaryError);
          if (summaryErrorMsg.includes('authentifi') || summaryErrorMsg.includes('autoris')) {
            console.warn('⚠️ [useFinance] Erreur d\'authentification/autorisation pour le summary, chargement annulé');
            if (!cancelled) {
              setError('Vous devez être connecté pour accéder aux données financières');
              setLoading(false);
            }
            return; // Arrêter le chargement
          }
          throw summaryError; // Propager les autres erreurs
        }

        // Charger les transactions
        const transactionsList = await getTransactionsUseCase.execute(merchantId, undefined, 50, 0);
        if (!cancelled) {
          setTransactions(transactionsList);
          console.log('✅ [useFinance] Transactions chargées');
        }

        // Charger les versements
        const payoutsList = await getPayoutsUseCase.execute(merchantId, 20, 0);
        if (!cancelled) {
          setPayouts(payoutsList);
          console.log('✅ [useFinance] Payouts chargés');
        }
      } catch (err) {
        if (!cancelled) {
          const errorMsg = err instanceof Error ? err.message : 'Erreur lors du chargement';
          setError(errorMsg);
          console.error('❌ [useFinance] Erreur chargement finances:', {
            error: err,
            message: errorMsg,
            merchantId
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          console.log('🏁 [useFinance] Chargement terminé');
        }
      }
    };

    loadInitialData();

    return () => {
      cancelled = true;
    };
    // Ne dépendre que de merchantId - le repository est mémorisé et ne change que si merchantId change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId]);

  /**
   * Rafraîchit le résumé financier
   */
  const refreshSummary = useCallback(async (
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all' = 'monthly'
  ) => {
    // Ne rien faire si pas de merchantId valide
    if (!merchantId || merchantId === 'temp' || merchantId === '' || merchantId === 'undefined' || merchantId === 'null') {
      console.warn('⚠️ [useFinance] refreshSummary appelé sans merchantId valide:', merchantId);
      return;
    }
    
    try {
      setError(null);
      const financeSummary = await getFinanceSummaryUseCase.execute(merchantId, period);
      setSummary(financeSummary);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors du chargement du résumé';
      setError(errorMsg);
      console.error('❌ [useFinance] Erreur résumé financier:', err);
      throw err;
    }
  }, [merchantId, getFinanceSummaryUseCase]);

  /**
   * Charge les transactions
   */
  const loadTransactions = useCallback(async (filters?: any) => {
    // Ne rien faire si pas de merchantId valide
    if (!merchantId || merchantId === 'temp' || merchantId === '' || merchantId === 'undefined' || merchantId === 'null') {
      console.warn('⚠️ [useFinance] loadTransactions appelé sans merchantId valide:', merchantId);
      return;
    }
    
    try {
      setError(null);
      const transactionsList = await getTransactionsUseCase.execute(merchantId, filters, 50, 0);
      setTransactions(transactionsList);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors du chargement des transactions';
      setError(errorMsg);
      console.error('❌ [useFinance] Erreur transactions:', err);
      throw err;
    }
  }, [merchantId, getTransactionsUseCase]);

  /**
   * Charge les versements
   */
  const loadPayouts = useCallback(async () => {
    // Ne rien faire si pas de merchantId valide
    if (!merchantId || merchantId === 'temp' || merchantId === '' || merchantId === 'undefined' || merchantId === 'null') {
      console.warn('⚠️ [useFinance] loadPayouts appelé sans merchantId valide:', merchantId);
      return;
    }
    
    try {
      setError(null);
      const payoutsList = await getPayoutsUseCase.execute(merchantId, 20, 0);
      setPayouts(payoutsList);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors du chargement des versements';
      setError(errorMsg);
      console.error('❌ [useFinance] Erreur versements:', err);
      throw err;
    }
  }, [merchantId, getPayoutsUseCase]);

  /**
   * Reset l'erreur
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    summary,
    transactions,
    payouts,
    loading,
    error,
    refreshSummary,
    loadTransactions,
    loadPayouts,
    resetError,
  };
}

