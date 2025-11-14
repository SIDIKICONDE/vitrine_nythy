/**
 * Entité: DashboardSummary
 * Résumé du dashboard marchand
 */

export interface DashboardSummaryData {
  totalRevenue: number;
  todayRevenue: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  averageRating: number;
  totalReviews: number;
}

export class DashboardSummary {
  constructor(
    public readonly totalRevenue: number,
    public readonly todayRevenue: number,
    public readonly activeProducts: number,
    public readonly totalOrders: number,
    public readonly pendingOrders: number,
    public readonly averageRating: number,
    public readonly totalReviews: number
  ) {
    this.validate();
  }

  /**
   * Factory method depuis un objet DashboardSummaryData
   */
  static from(data: DashboardSummaryData): DashboardSummary {
    return new DashboardSummary(
      data.totalRevenue,
      data.todayRevenue,
      data.activeProducts,
      data.totalOrders,
      data.pendingOrders,
      data.averageRating,
      data.totalReviews
    );
  }

  /**
   * Validation
   */
  private validate(): void {
    if (this.totalRevenue < 0) {
      throw new Error('Le revenu total doit être positif');
    }
    if (this.todayRevenue < 0) {
      throw new Error('Le revenu du jour doit être positif');
    }
    if (this.activeProducts < 0) {
      throw new Error('Le nombre de produits actifs doit être positif');
    }
    if (this.totalOrders < 0) {
      throw new Error('Le nombre total de commandes doit être positif');
    }
    if (this.pendingOrders < 0) {
      throw new Error('Le nombre de commandes en attente doit être positif');
    }
    if (this.averageRating < 0 || this.averageRating > 5) {
      throw new Error('La note moyenne doit être entre 0 et 5');
    }
    if (this.totalReviews < 0) {
      throw new Error('Le nombre total d\'avis doit être positif');
    }
  }

  /**
   * Revenus formatés
   */
  get formattedRevenue(): string {
    return `€${(this.totalRevenue / 100).toFixed(2)}`;
  }

  /**
   * Revenus du jour formatés
   */
  get formattedTodayRevenue(): string {
    return `€${(this.todayRevenue / 100).toFixed(2)}`;
  }

  /**
   * Note formatée
   */
  get formattedRating(): string {
    return this.averageRating.toFixed(1);
  }

  /**
   * Note avec étoiles
   */
  get ratingStars(): string {
    const fullStars = Math.floor(this.averageRating);
    const hasHalfStar = this.averageRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
      '★'.repeat(fullStars) +
      (hasHalfStar ? '½' : '') +
      '☆'.repeat(emptyStars)
    );
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): DashboardSummaryData {
    return {
      totalRevenue: this.totalRevenue,
      todayRevenue: this.todayRevenue,
      activeProducts: this.activeProducts,
      totalOrders: this.totalOrders,
      pendingOrders: this.pendingOrders,
      averageRating: this.averageRating,
      totalReviews: this.totalReviews,
    };
  }
}

