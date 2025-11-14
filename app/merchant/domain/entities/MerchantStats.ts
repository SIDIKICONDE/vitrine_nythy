/**
 * Entité: MerchantStats
 * Statistiques d'un commerçant
 */

export interface MerchantStatsData {
  totalProducts?: number;
  totalFollowers?: number;
  totalReviews?: number;
  averageRating?: number;
  totalViews?: number;
  totalSales?: number;
  // Compatibilité avec l'API
  productsCount?: number;
  followersCount?: number;
  savedItemsCount?: number;
  co2Saved?: number;
  totalOrders?: number;
  totalRevenue?: number;
}

export class MerchantStats {
  constructor(
    public readonly totalProducts: number = 0,
    public readonly totalFollowers: number = 0,
    public readonly totalReviews: number = 0,
    public readonly averageRating: number = 0.0,
    public readonly totalViews: number = 0,
    public readonly totalSales: number = 0
  ) { }

  /**
   * Factory method depuis un objet MerchantStatsData
   */
  static from(data: MerchantStatsData): MerchantStats {
    return new MerchantStats(
      data.totalProducts,
      data.totalFollowers,
      data.totalReviews,
      data.averageRating,
      data.totalViews,
      data.totalSales
    );
  }

  /**
   * Créer des stats vides
   */
  static empty(): MerchantStats {
    return new MerchantStats(0, 0, 0, 0.0, 0, 0);
  }

  /**
   * Rating formaté
   */
  get formattedRating(): string {
    if (this.totalReviews === 0) {
      return 'Aucun avis';
    }
    return `${this.averageRating.toFixed(1)}/5 (${this.totalReviews} avis)`;
  }

  /**
   * Taux d'engagement (%)
   */
  get engagementRate(): number {
    if (this.totalViews === 0) {
      return 0.0;
    }
    return (this.totalSales / this.totalViews) * 100;
  }

  /**
   * Taux de conversion (%)
   */
  get conversionRate(): number {
    return this.engagementRate;
  }

  /**
   * Popularité (0-100)
   */
  get popularityScore(): number {
    // Score basé sur followers, reviews et rating
    const followersScore = Math.min(this.totalFollowers / 10, 40); // Max 40 points
    const reviewsScore = Math.min(this.totalReviews / 5, 30); // Max 30 points
    const ratingScore = (this.averageRating / 5) * 30; // Max 30 points
    return Math.round(followersScore + reviewsScore + ratingScore);
  }

  /**
   * A des statistiques significatives
   */
  get hasSignificantStats(): boolean {
    return this.totalSales > 0 || this.totalReviews > 0 || this.totalFollowers > 0;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): MerchantStatsData {
    return {
      totalProducts: this.totalProducts,
      totalFollowers: this.totalFollowers,
      totalReviews: this.totalReviews,
      averageRating: this.averageRating,
      totalViews: this.totalViews,
      totalSales: this.totalSales,
    };
  }
}

