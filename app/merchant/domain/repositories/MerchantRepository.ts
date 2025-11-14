/**
 * Repository Interface pour les Merchants
 * 
 * ✅ ARCHITECTURE DDD - Port (Hexagonal Architecture)
 * - Interface abstraite du domaine
 * - Découplage domaine/infrastructure
 * - L'implémentation concrète (Firebase, API REST, etc.) est dans l'infrastructure
 */

import { Merchant } from '../entities/Merchant';
import { MerchantSalesStats } from '../entities/MerchantSalesStats';
import { MerchantStatistics } from '../usecases/GetMerchantStatisticsUseCase';

export interface MerchantUpdateData {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  imageUrls?: string[];
  bannerUrl?: string;
  tags?: string[];
  [key: string]: any;
}

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

  /**
   * Enregistre un nouveau commerçant
   * @param merchantData Données du commerçant
   * @returns Le commerçant créé
   */
  registerMerchant(merchantData: any): Promise<Merchant>;

  /**
   * Complète l'onboarding d'un commerçant
   * @param merchantId ID du commerçant
   * @returns Le commerçant mis à jour
   */
  completeOnboarding(merchantId: string): Promise<Merchant>;

  /**
   * Supprime un commerçant
   * @param merchantId ID du commerçant
   */
  deleteMerchant(merchantId: string): Promise<void>;

  /**
   * Fait suivre un commerçant par un utilisateur
   * @param userId ID de l'utilisateur
   * @param merchantId ID du commerçant
   */
  followMerchant(userId: string, merchantId: string): Promise<void>;

  /**
   * Récupère les commerçants suivis par un utilisateur
   * @param userId ID de l'utilisateur
   * @returns La liste des commerçants suivis
   */
  getFollowedMerchants(userId: string): Promise<Merchant[]>;

  /**
   * Récupère les produits d'un commerçant
   * @param merchantId ID du commerçant
   * @returns La liste des produits
   */
  getMerchantProducts(merchantId: string): Promise<any[]>;

  /**
   * Récupère les évaluations d'un commerçant
   * @param merchantId ID du commerçant
   * @returns Les évaluations
   */
  getMerchantRatings(merchantId: string): Promise<any>;

  /**
   * Note un commerçant
   * @param userId ID de l'utilisateur
   * @param merchantId ID du commerçant
   * @param rating Note
   * @param comment Commentaire
   */
  rateMerchant(userId: string, merchantId: string, rating: number, comment?: string): Promise<void>;

  /**
   * Récupère les commerçants par catégorie
   * @param category Catégorie
   * @returns La liste des commerçants
   */
  getMerchantsByCategory(category: string): Promise<Merchant[]>;

  /**
   * Recherche des commerçants à proximité
   * @param latitude Latitude
   * @param longitude Longitude
   * @param radiusKm Rayon en km
   * @returns La liste des commerçants
   */
  searchNearby(latitude: number, longitude: number, radiusKm: number): Promise<Merchant[]>;

  /**
   * Suspend un commerçant
   * @param merchantId ID du commerçant
   * @param reason Raison de la suspension
   */
  suspendMerchant(merchantId: string, reason: string): Promise<void>;

  /**
   * Vérifie un commerçant
   * @param merchantId ID du commerçant
   */
  verifyMerchant(merchantId: string): Promise<void>;
}
