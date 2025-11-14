/**
 * Entité MerchantSalesStats - Statistiques de ventes
 * Représente les statistiques de ventes d'un commerçant
 */

import { Money } from '../value-objects/Money';
import { DailyRevenue } from './FinanceSummary';

export interface MerchantSalesStats {
  merchantId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  totalRevenue: Money;
  totalOrders: number;
  averageOrderValue: Money;
  totalItemsSold: number;
  totalItemsSaved: number; // Items sauvés du gaspillage
  conversionRate: number; // Pourcentage
  returningCustomers: number;
  newCustomers: number;
  topSellingProducts: TopSellingProduct[];
  revenueByDay?: DailyRevenue[];
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
}

export interface TopSellingProduct {
  productId: string;
  productName: string;
  quantitySold: number;
  revenue: Money;
}

export class MerchantSalesStatsEntity implements MerchantSalesStats {
  constructor(
    public readonly merchantId: string,
    public readonly period: 'daily' | 'weekly' | 'monthly' | 'yearly',
    public readonly totalRevenue: Money,
    public readonly totalOrders: number,
    public readonly averageOrderValue: Money,
    public readonly totalItemsSold: number,
    public readonly totalItemsSaved: number,
    public readonly conversionRate: number,
    public readonly returningCustomers: number,
    public readonly newCustomers: number,
    public readonly topSellingProducts: TopSellingProduct[],
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly generatedAt: Date,
    public readonly revenueByDay?: DailyRevenue[]
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.merchantId || this.merchantId.trim() === '') {
      throw new Error('Merchant ID cannot be empty');
    }
    if (this.totalOrders < 0) {
      throw new Error('Total orders cannot be negative');
    }
    if (this.conversionRate < 0 || this.conversionRate > 100) {
      throw new Error('Conversion rate must be between 0 and 100');
    }
    if (this.startDate >= this.endDate) {
      throw new Error('Start date must be before end date');
    }
  }

  /**
   * Calculer le taux de clients récurrents
   */
  get returningCustomerRate(): number {
    const totalCustomers = this.returningCustomers + this.newCustomers;
    if (totalCustomers === 0) return 0;
    return (this.returningCustomers / totalCustomers) * 100;
  }

  /**
   * Calculer le nombre total de clients
   */
  get totalCustomers(): number {
    return this.returningCustomers + this.newCustomers;
  }

  /**
   * Calculer la croissance du revenu (si revenueByDay est disponible)
   */
  get revenueGrowthRate(): number | null {
    if (!this.revenueByDay || this.revenueByDay.length < 2) {
      return null;
    }

    const firstDay = this.revenueByDay[0];
    const lastDay = this.revenueByDay[this.revenueByDay.length - 1];

    if (!firstDay || !lastDay || firstDay.revenue.amountMinor === 0) {
      return 0;
    }

    const growth = ((lastDay.revenue.amountMinor - firstDay.revenue.amountMinor) / 
                    firstDay.revenue.amountMinor) * 100;
    
    return parseFloat(growth.toFixed(2));
  }

  /**
   * Obtenir le produit le plus vendu
   */
  get topProduct(): TopSellingProduct | null {
    if (this.topSellingProducts.length === 0) {
      return null;
    }
    return this.topSellingProducts[0] ?? null;
  }

  /**
   * Calculer l'impact anti-gaspillage (kg de nourriture sauvée)
   * Estimation: 1 item = 0.5kg en moyenne
   */
  get estimatedKgSaved(): number {
    return this.totalItemsSaved * 0.5;
  }

  /**
   * Calculer les économies pour les clients
   * Estimation: 60% de réduction moyenne
   */
  get estimatedCustomerSavings(): Money {
    const estimatedOriginalValue = this.totalRevenue.amountMinor / 0.4; // Si 40% du prix, alors 100% = x / 0.4
    const savings = estimatedOriginalValue - this.totalRevenue.amountMinor;
    return Money.fromMinor(Math.round(savings), this.totalRevenue.currencyCode);
  }

  /**
   * Créer à partir d'un objet simple
   */
  static fromJson(json: any): MerchantSalesStatsEntity {
    return new MerchantSalesStatsEntity(
      json.merchantId || json.merchant_id,
      json.period,
      Money.from(json.totalRevenue || json.total_revenue),
      json.totalOrders || json.total_orders,
      Money.from(json.averageOrderValue || json.average_order_value),
      json.totalItemsSold || json.total_items_sold,
      json.totalItemsSaved || json.total_items_saved,
      json.conversionRate || json.conversion_rate,
      json.returningCustomers || json.returning_customers,
      json.newCustomers || json.new_customers,
      (json.topSellingProducts || json.top_selling_products || []).map((p: any) => ({
        productId: p.productId || p.product_id,
        productName: p.productName || p.product_name,
        quantitySold: p.quantitySold || p.quantity_sold,
        revenue: Money.from(p.revenue),
      })),
      new Date(json.startDate || json.start_date),
      new Date(json.endDate || json.end_date),
      new Date(json.generatedAt || json.generated_at),
      json.revenueByDay ? json.revenueByDay.map((d: any) => ({
        date: new Date(d.date),
        revenue: Money.from(d.revenue),
        orders: d.orders,
      })) : undefined
    );
  }

  /**
   * Convertir en objet simple
   */
  toJson(): any {
    return {
      merchant_id: this.merchantId,
      period: this.period,
      total_revenue: this.totalRevenue.toJSON(),
      total_orders: this.totalOrders,
      average_order_value: this.averageOrderValue.toJSON(),
      total_items_sold: this.totalItemsSold,
      total_items_saved: this.totalItemsSaved,
      conversion_rate: this.conversionRate,
      returning_customers: this.returningCustomers,
      new_customers: this.newCustomers,
      top_selling_products: this.topSellingProducts.map(p => ({
        product_id: p.productId,
        product_name: p.productName,
        quantity_sold: p.quantitySold,
        revenue: p.revenue.toJSON(),
      })),
      start_date: this.startDate.toISOString(),
      end_date: this.endDate.toISOString(),
      generated_at: this.generatedAt.toISOString(),
      revenue_by_day: this.revenueByDay?.map(d => ({
        date: d.date.toISOString(),
        revenue: d.revenue,
        orders: d.orders,
      })),
    };
  }
}

