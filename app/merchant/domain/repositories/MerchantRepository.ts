/**
 * Repository Interface pour les Merchants
 * 
 * ✅ ARCHITECTURE DDD - Port (Hexagonal Architecture)
 * - Interface abstraite du domaine
 * - Découplage domaine/infrastructure
 * - L'implémentation concrète (Firebase, API REST, etc.) est dans l'infrastructure
 */

import { Merchant, MerchantUpdateData } from '@/types/merchant';
import { MerchantSalesStats } from '../entities/MerchantSalesStats';
import { MerchantStatistics } from '../usecases/GetMerchantStatisticsUseCase';

export interface MerchantRepository {
  /**
   * Récupère un commerçant par son ID
   * @param merchantId ID du commerçant
   * @returns Le commerçant ou null si introuvable
   */
  getMerchantById(merchantId: string): Promise<Merchant | null>;

  /**
   * Met à jour un commerçant
   * @param merchantId ID du commerçant
   * @param updateData Données à mettre à jour
   * @returns Le commerçant mis à jour
   */
  updateMerchant(merchantId: string, updateData: MerchantUpdateData): Promise<Merchant>;

  /**
   * Récupère les paramètres d'un commerçant
   * @param merchantId ID du commerçant
   * @returns Les paramètres du commerçant
   */
  getMerchantSettings(merchantId: string): Promise<any>;

  /**
   * Met à jour les paramètres d'un commerçant
   * @param merchantId ID du commerçant
   * @param settings Nouveaux paramètres
   */
  updateMerchantSettings(merchantId: string, settings: any): Promise<void>;

  /**
   * Récupère les statistiques de ventes d'un commerçant
   * @param merchantId ID du commerçant
   * @param period Période (daily, weekly, monthly, yearly)
   * @param startDate Date de début (optionnelle)
   * @param endDate Date de fin (optionnelle)
   * @returns Les statistiques de ventes
   */
  getMerchantSalesStats(
    merchantId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    startDate?: Date,
    endDate?: Date
  ): Promise<MerchantSalesStats>;

  /**
   * Récupère les statistiques d'impact anti-gaspillage d'un commerçant
   * @param merchantId ID du commerçant
   * @returns Les statistiques d'impact
   */
  getMerchantStatistics(merchantId: string): Promise<MerchantStatistics>;
}
