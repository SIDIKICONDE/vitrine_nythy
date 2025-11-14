/**
 * Repository pour les opérations sur les marchands via API
 * Note: Implémentation partielle des méthodes nécessaires pour useMerchantSettings
 */

import { MerchantSalesStats } from '@/app/merchant/domain/entities/MerchantSalesStats';
import { Merchant } from '@/app/merchant/domain/entities/Merchant';
import { MerchantRepository, MerchantUpdateData } from '@/app/merchant/domain/repositories/MerchantRepository';
import { MerchantStatistics } from '@/app/merchant/domain/usecases/GetMerchantStatisticsUseCase';
import { createAuthHeaders } from '@/lib/csrf-client';
import { Merchant as ApiMerchant } from '@/types/merchant';
import { MerchantType } from '@/app/merchant/domain/enums/MerchantType';

export class ApiMerchantRepository implements MerchantRepository {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Convertit les données API vers l'entité domaine Merchant
   */
  private apiMerchantToDomain(apiMerchant: any): Merchant {
    return Merchant.from({
      id: apiMerchant.id,
      name: apiMerchant.business_name || apiMerchant.name || '',
      type: (apiMerchant.merchantType || apiMerchant.merchant_type || apiMerchant.type || apiMerchant.category || 'autre') as MerchantType,
      description: apiMerchant.description || '',
      imageUrls: apiMerchant.gallery || [],
      bannerUrl: apiMerchant.banner || apiMerchant.banner_url || '',
      location: (apiMerchant.latitude && apiMerchant.longitude) ? {
        latitude: apiMerchant.latitude,
        longitude: apiMerchant.longitude,
      } : undefined,
      addressLine1: apiMerchant.address || '',
      city: apiMerchant.city || '',
      countryCode: apiMerchant.country || 'FR',
      tags: apiMerchant.tags || [],
      phone: apiMerchant.phone || apiMerchant.contact_phone || '',
      websiteUrl: apiMerchant.website || '',
      createdAt: apiMerchant.created_at ? new Date(apiMerchant.created_at) : new Date(),
      updatedAt: apiMerchant.updated_at ? new Date(apiMerchant.updated_at) : new Date(),
      isVerified: apiMerchant.verification_status === 'verified',
      isActive: apiMerchant.status === 'active',
      stats: {
        followersCount: apiMerchant.stats?.followersCount || apiMerchant.followers_count || 0,
        averageRating: apiMerchant.stats?.averageRating || apiMerchant.average_rating || 0,
        totalReviews: apiMerchant.stats?.totalReviews || apiMerchant.total_reviews || 0,
        savedItemsCount: apiMerchant.stats?.savedItemsCount || apiMerchant.saved_items_count || 0,
        co2Saved: apiMerchant.stats?.co2Saved || apiMerchant.co2_saved || 0,
        totalOrders: apiMerchant.stats?.totalOrders || apiMerchant.total_orders || 0,
        totalRevenue: apiMerchant.stats?.totalRevenue || apiMerchant.total_revenue || 0,
        productsCount: apiMerchant.stats?.productsCount || apiMerchant.total_products || 0,
      },
      email: apiMerchant.email || apiMerchant.contact_email || '',
      siret: apiMerchant.siret || '',
      messageEnabled: apiMerchant.message_enabled !== false,
      ownerUserId: apiMerchant.owner_user_id || apiMerchant.ownerUserId || '',
      iban: apiMerchant.iban || '',
      bic: apiMerchant.bic || '',
      paymentPreference: apiMerchant.payment_preference || '',
    });
  }

  /**
   * Récupère un marchand par son ID
   */
  async getMerchantById(_merchantId: string): Promise<Merchant | null> {
    try {
      const response = await fetch(`${this.baseUrl}/merchant/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la récupération du marchand');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération du marchand');
      }

      return this.apiMerchantToDomain(data.merchant);
    } catch (error) {
      console.error('Erreur getMerchantById:', error);
      throw error;
    }
  }

  /**
   * Met à jour un marchand
   */
  async updateMerchant(merchantId: string, data: MerchantUpdateData): Promise<Merchant> {
    try {
      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch(`${this.baseUrl}/merchant/${merchantId}/settings`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la mise à jour du marchand');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la mise à jour du marchand');
      }

      console.log('✅ Marchand mis à jour');

      // Récupérer et retourner le marchand mis à jour
      const updatedMerchant = await this.getMerchantById(merchantId);
      if (!updatedMerchant) {
        throw new Error('Impossible de récupérer le marchand mis à jour');
      }

      return updatedMerchant;
    } catch (error) {
      console.error('Erreur updateMerchant:', error);
      throw error;
    }
  }

  /**
   * Enregistre un nouveau commerçant
   */
  async registerMerchant(_merchantData: any): Promise<Merchant> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Complète l'onboarding d'un commerçant
   */
  async completeOnboarding(merchantId: string): Promise<Merchant> {
    const merchant = await this.getMerchantById(merchantId);
    if (!merchant) {
      throw new Error('Merchant not found');
    }
    return merchant;
  }

  /**
   * Supprime un marchand
   */
  async deleteMerchant(_merchantId: string): Promise<void> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Fait suivre un commerçant par un utilisateur
   */
  async followMerchant(_userId: string, _merchantId: string): Promise<void> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Récupère les commerçants suivis par un utilisateur
   */
  async getFollowedMerchants(_userId: string): Promise<Merchant[]> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Récupère les produits d'un commerçant
   */
  async getMerchantProducts(_merchantId: string): Promise<any[]> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Récupère les évaluations d'un commerçant
   */
  async getMerchantRatings(_merchantId: string): Promise<any> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Note un commerçant
   */
  async rateMerchant(_userId: string, _merchantId: string, _rating: number, _comment?: string): Promise<void> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Récupère les commerçants par catégorie
   */
  async getMerchantsByCategory(_category: string): Promise<Merchant[]> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Recherche des commerçants à proximité
   */
  async searchNearby(_latitude: number, _longitude: number, _radiusKm: number): Promise<Merchant[]> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Suspend un commerçant
   */
  async suspendMerchant(_merchantId: string, _reason: string): Promise<void> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Vérifie un commerçant
   */
  async verifyMerchant(_merchantId: string): Promise<void> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Récupère les paramètres d'un commerçant
   */
  async getMerchantSettings(merchantId: string): Promise<any> {
    const merchant = await this.getMerchantById(merchantId);
    // Les settings ne sont pas directement disponibles dans l'entité domaine Merchant
    // Retourner un objet par défaut pour la compatibilité
    return {
      notifications: { email: true, sms: false, push: true },
      privacy: { showPhone: true, showEmail: true, showAddress: true },
      preferences: { language: 'fr', currency: 'EUR', timezone: 'Europe/Paris' },
    };
  }

  /**
   * Met à jour les paramètres d'un commerçant
   */
  async updateMerchantSettings(merchantId: string, settings: any): Promise<void> {
    await this.updateMerchant(merchantId, { settings });
  }

  /**
   * Récupère les statistiques de ventes d'un commerçant
   */
  async getMerchantSalesStats(
    merchantId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    _startDate?: Date,
    _endDate?: Date
  ): Promise<MerchantSalesStats> {
    try {
      console.log('📊 [ApiMerchantRepository] Appel API stats ventes:', { merchantId, period });

      const response = await fetch(
        `${this.baseUrl}/merchant/${merchantId}/stats/sales?period=${period}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      console.log('📊 [ApiMerchantRepository] Réponse API:', {
        status: response.status,
        ok: response.ok,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [ApiMerchantRepository] Erreur API:', errorData);
        throw new Error(errorData.message || 'Erreur lors de la récupération des statistiques de ventes');
      }

      const data = await response.json();
      console.log('📊 [ApiMerchantRepository] Données reçues:', {
        success: data.success,
        hasStats: !!data.stats,
        totalOrders: data.stats?.totalOrders,
      });

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des statistiques de ventes');
      }

      // Convertir les données de l'API vers MerchantSalesStats
      const stats = data.stats;
      const { Money } = await import('@/app/merchant/domain/value-objects/Money');

      return {
        merchantId: stats.merchantId,
        period: stats.period,
        totalRevenue: Money.from(stats.totalRevenue as { amountMinor: number; currencyCode: string }),
        totalOrders: stats.totalOrders,
        averageOrderValue: Money.from(stats.averageOrderValue as { amountMinor: number; currencyCode: string }),
        totalItemsSold: stats.totalItemsSold,
        totalItemsSaved: stats.totalItemsSaved,
        conversionRate: stats.conversionRate,
        returningCustomers: stats.returningCustomers,
        newCustomers: stats.newCustomers,
        topSellingProducts: stats.topSellingProducts.map((p: any) => ({
          productId: p.productId,
          productName: p.productName,
          quantitySold: p.quantitySold,
          revenue: Money.from(p.revenue as { amountMinor: number; currencyCode: string }),
        })),
        revenueByDay: stats.revenueByDay?.map((d: any) => ({
          date: new Date(d.date),
          revenue: Money.from(d.revenue as { amountMinor: number; currencyCode: string }),
          orders: d.orders,
        })),
        startDate: new Date(stats.startDate),
        endDate: new Date(stats.endDate),
        generatedAt: new Date(stats.generatedAt),
      };
    } catch (error) {
      console.error('Erreur getMerchantSalesStats:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques d'impact anti-gaspillage d'un commerçant
   */
  async getMerchantStatistics(merchantId: string): Promise<MerchantStatistics> {
    try {
      const response = await fetch(
        `${this.baseUrl}/merchant/${merchantId}/stats/impact`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la récupération des statistiques d\'impact');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des statistiques d\'impact');
      }

      // Convertir les données de l'API vers MerchantStatistics
      const stats = data.stats;

      return {
        merchantId: stats.merchantId,
        totalItemsSaved: stats.totalItemsSaved,
        totalCO2Saved: stats.totalCO2Saved,
        totalMoneyDistributed: stats.totalMoneyDistributed,
        totalCustomers: stats.totalCustomers,
        impactScore: stats.impactScore,
        generatedAt: new Date(stats.generatedAt),
      };
    } catch (error) {
      console.error('Erreur getMerchantStatistics:', error);
      throw error;
    }
  }
}

// Instance singleton
const apiMerchantRepository = new ApiMerchantRepository();
export default apiMerchantRepository;

