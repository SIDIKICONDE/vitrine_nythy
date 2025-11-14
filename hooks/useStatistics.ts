/**
 * Hook: useStatistics
 * Gestion des statistiques d'un commerçant avec architecture DDD
 * 
 * ✅ ARCHITECTURE DDD
 * - Utilise les Use Cases du domaine
 * - Séparation présentation/domaine
 * - État UI découplé du domaine
 */

import { useCallback, useEffect, useState } from 'react';
import { MerchantSalesStats } from '../app/merchant/domain/entities/MerchantSalesStats';
import { MerchantRepository } from '../app/merchant/domain/repositories/MerchantRepository';
import { GetMerchantSalesStatsUseCase } from '../app/merchant/domain/usecases/GetMerchantSalesStatsUseCase';
import { GetMerchantStatisticsUseCase, MerchantStatistics } from '../app/merchant/domain/usecases/GetMerchantStatisticsUseCase';

export interface UseStatisticsResult {
  // État
  salesStats: MerchantSalesStats | null;
  impactStats: MerchantStatistics | null;
  loading: boolean;
  error: string | null;

  // Actions
  refreshSalesStats: (period?: 'daily' | 'weekly' | 'monthly' | 'yearly') => Promise<void>;
  refreshImpactStats: () => Promise<void>;
  resetError: () => void;
}

export function useStatistics(
  merchantId: string,
  merchantRepository: MerchantRepository
): UseStatisticsResult {
  // === État local ===
  const [salesStats, setSalesStats] = useState<MerchantSalesStats | null>(null);
  const [impactStats, setImpactStats] = useState<MerchantStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // === Use Cases ===
  const getMerchantSalesStatsUseCase = new GetMerchantSalesStatsUseCase(merchantRepository);
  const getMerchantStatisticsUseCase = new GetMerchantStatisticsUseCase(merchantRepository);

  // === Chargement initial ===
  useEffect(() => {
    // Ne charger que si on a un vrai merchantId (pas vide, pas 'temp')
    if (!merchantId || merchantId === 'temp' || merchantId === '') {
      return;
    }

    const loadInitialData = async () => {
      try {
        console.log('📊 [useStatistics] Début chargement pour merchantId:', merchantId);
        setLoading(true);
        setError(null);

        // Charger les stats de ventes
        console.log('📈 [useStatistics] Chargement stats ventes...');
        const sales = await getMerchantSalesStatsUseCase.execute(merchantId, 'monthly');
        console.log('✅ [useStatistics] Stats ventes chargées:', {
          totalOrders: sales.totalOrders,
          totalRevenue: sales.totalRevenue.amountMinor,
        });
        setSalesStats(sales);

        // Charger les stats d'impact
        console.log('🌱 [useStatistics] Chargement stats impact...');
        const impact = await getMerchantStatisticsUseCase.execute(merchantId);
        console.log('✅ [useStatistics] Stats impact chargées:', {
          totalItemsSaved: impact.totalItemsSaved,
          impactScore: impact.impactScore,
        });
        setImpactStats(impact);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        console.error('❌ [useStatistics] Erreur chargement statistiques:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId]);

  /**
   * Rafraîchit les statistiques de ventes
   */
  const refreshSalesStats = useCallback(async (
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ) => {
    // Ne rien faire si pas de merchantId valide
    if (!merchantId || merchantId === 'temp' || merchantId === '') {
      console.warn('⚠️ refreshSalesStats appelé sans merchantId valide');
      return;
    }
    
    try {
      setError(null);
      const stats = await getMerchantSalesStatsUseCase.execute(merchantId, period);
      setSalesStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques de ventes');
      console.error('❌ Erreur statistiques de ventes:', err);
      throw err;
    }
  }, [merchantId, getMerchantSalesStatsUseCase]);

  /**
   * Rafraîchit les statistiques d'impact
   */
  const refreshImpactStats = useCallback(async () => {
    // Ne rien faire si pas de merchantId valide
    if (!merchantId || merchantId === 'temp' || merchantId === '') {
      console.warn('⚠️ refreshImpactStats appelé sans merchantId valide');
      return;
    }
    
    try {
      setError(null);
      const stats = await getMerchantStatisticsUseCase.execute(merchantId);
      setImpactStats(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques d\'impact');
      console.error('❌ Erreur statistiques d\'impact:', err);
      throw err;
    }
  }, [merchantId, getMerchantStatisticsUseCase]);

  /**
   * Reset l'erreur
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    salesStats,
    impactStats,
    loading,
    error,
    refreshSalesStats,
    refreshImpactStats,
    resetError,
  };
}

