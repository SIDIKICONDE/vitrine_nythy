/**
 * Repository pour les opérations sur les marchands via API
 * Note: Implémentation partielle des méthodes nécessaires pour useMerchantSettings
 */

import { MerchantSalesStats } from '@/app/merchant/domain/entities/MerchantSalesStats';
import { MerchantRepository } from '@/app/merchant/domain/repositories/MerchantRepository';
import { MerchantStatistics } from '@/app/merchant/domain/usecases/GetMerchantStatisticsUseCase';
import { createAuthHeaders } from '@/lib/csrf-client';
import { Merchant, MerchantUpdateData } from '@/types/merchant';

export class ApiMerchantRepository implements MerchantRepository {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
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

      const merchant = data.merchant;

      // Normaliser les données en format pour le domaine Merchant
      return {
        id: merchant.id,
        ownerUserId: merchant.owner_user_id || merchant.ownerUserId || '',
        businessName: merchant.business_name || merchant.name || '',
        legalName: merchant.legal_name || merchant.business_name || '',
        siret: merchant.siret || '',
        merchantType: merchant.merchantType || merchant.merchant_type || merchant.type || merchant.category || 'autre',
        description: merchant.description || '',
        status: merchant.status || 'active',
        verificationStatus: merchant.verification_status || 'pending',

        // Contact et localisation
        address: {
          street: merchant.address || '',
          postalCode: merchant.postal_code || merchant.postalCode || '',
          city: merchant.city || '',
          countryCode: merchant.country || 'FR',
          location: {
            latitude: merchant.latitude || 0,
            longitude: merchant.longitude || 0,
          }
        },
        contactInfo: {
          email: merchant.email || merchant.contact_email || '',
          phone: merchant.phone || merchant.contact_phone || '',
          website: merchant.website || '',
        },
        socials: {
          instagram: merchant.instagram || '',
          facebook: merchant.facebook || '',
        },

        // Images
        logoUrl: merchant.logo || merchant.logo_url || '',
        bannerUrl: merchant.banner || merchant.banner_url || '',
        gallery: merchant.gallery || [],

        // Horaires et livraison
        operatingHours: merchant.opening_hours || merchant.operatingHours || {},
        deliveryOptions: merchant.delivery_options || merchant.deliveryOptions || {
          inStorePickup: true,
          localDelivery: false,
        },
        averagePrepTimeMinutes: merchant.average_prep_time_minutes || 15,

        // Pricing et langues
        languages: merchant.languages || ['fr'],
        acceptsSurpriseBox: merchant.accepts_surprise_box !== false,

        // Statistiques
        stats: {
          followersCount: merchant.stats?.followersCount || merchant.followers_count || 0,
          averageRating: merchant.stats?.averageRating || merchant.average_rating || 0,
          totalReviews: merchant.stats?.totalReviews || merchant.total_reviews || 0,
          savedItemsCount: merchant.stats?.savedItemsCount || merchant.saved_items_count || 0,
          co2Saved: merchant.stats?.co2Saved || merchant.co2_saved || 0,
          totalOrders: merchant.stats?.totalOrders || merchant.total_orders || 0,
          totalRevenue: merchant.stats?.totalRevenue || merchant.total_revenue || 0,
          productsCount: merchant.stats?.productsCount || merchant.total_products || 0,
        },

        // Configuration
        settings: {
          notifications: merchant.notifications || merchant.settings?.notifications || {
            email: true,
            sms: false,
            push: true,
          },
          privacy: merchant.privacy || merchant.settings?.privacy || {
            showPhone: true,
            showEmail: true,
            showAddress: true,
          },
          preferences: merchant.preferences || merchant.settings?.preferences || {
            language: 'fr',
            currency: 'EUR',
            timezone: 'Europe/Paris',
          },
        },

        // Métadonnées
        createdAt: merchant.created_at ? new Date(merchant.created_at) : new Date(),
        updatedAt: merchant.updated_at ? new Date(merchant.updated_at) : new Date(),
      } as Merchant;
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
   * Récupère tous les marchands (non implémenté pour l'instant)
   */
  async getAllMerchants(): Promise<Merchant[]> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Crée un nouveau marchand (non implémenté pour l'instant)
   */
  async createMerchant(_data: any): Promise<string> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Supprime un marchand (non implémenté pour l'instant)
   */
  async deleteMerchant(_merchantId: string): Promise<void> {
    throw new Error('Méthode non implémentée');
  }

  /**
   * Récupère les paramètres d'un commerçant
   */
  async getMerchantSettings(merchantId: string): Promise<any> {
    const merchant = await this.getMerchantById(merchantId);
    return merchant?.settings || null;
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

