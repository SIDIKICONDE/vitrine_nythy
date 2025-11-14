/**
 * Entité: FinanceSummary
 * Résumé financier d'un commerçant
 * 
 * ✅ ARCHITECTURE DDD
 * - Agrégat de données financières
 * - Calculs métier
 */

import { Money, MoneyData } from '../value-objects/Money';

export interface FinanceSummaryData {
  merchantId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';
  
  // Revenus
  totalRevenue: MoneyData;              // Revenus bruts totaux
  totalOrders: number;                 // Nombre de commandes
  averageOrderValue: MoneyData;       // Valeur moyenne d'une commande
  
  // Versements
  totalPayouts: MoneyData;             // Total des versements effectués
  pendingPayouts: MoneyData;           // Versements en attente
  nextPayoutDate?: Date;               // Date du prochain versement
  
  // Commissions et frais
  totalFees: MoneyData;                // Total des frais/commissions
  totalCommissions: MoneyData;         // Total des commissions Nythy
  
  // Montants nets
  netRevenue: MoneyData;                // Revenus nets (après frais)
  availableBalance: MoneyData;          // Solde disponible pour versement
  
  // Statistiques
  revenueByDay?: DailyRevenue[];      // Revenus par jour
  payoutHistory?: PayoutSummary[];     // Historique des versements
  
  // Période
  startDate: Date;
  endDate: Date;
  generatedAt: Date;
}

export interface DailyRevenue {
  date: Date;
  revenue: MoneyData;
  orders: number;
}

export interface PayoutSummary {
  id: string;
  amount: MoneyData;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledDate: Date;
  processedDate?: Date;
}

export class FinanceSummary {
  private _totalRevenue: Money;
  private _totalPayouts: Money;
  private _pendingPayouts: Money;
  private _totalFees: Money;
  private _totalCommissions: Money;
  private _netRevenue: Money;
  private _availableBalance: Money;
  private _averageOrderValue: Money;

  constructor(
    public readonly merchantId: string,
    public readonly period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all',
    totalRevenue: Money | MoneyData,
    public readonly totalOrders: number,
    averageOrderValue: Money | MoneyData,
    totalPayouts: Money | MoneyData,
    pendingPayouts: Money | MoneyData,
    totalFees: Money | MoneyData,
    totalCommissions: Money | MoneyData,
    netRevenue: Money | MoneyData,
    availableBalance: Money | MoneyData,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly generatedAt: Date = new Date(),
    public readonly revenueByDay?: DailyRevenue[],
    public readonly payoutHistory?: PayoutSummary[],
    public readonly nextPayoutDate?: Date
  ) {
    // Conversion des Money
    this._totalRevenue = totalRevenue instanceof Money ? totalRevenue : Money.from(totalRevenue);
    this._totalPayouts = totalPayouts instanceof Money ? totalPayouts : Money.from(totalPayouts);
    this._pendingPayouts = pendingPayouts instanceof Money ? pendingPayouts : Money.from(pendingPayouts);
    this._totalFees = totalFees instanceof Money ? totalFees : Money.from(totalFees);
    this._totalCommissions = totalCommissions instanceof Money ? totalCommissions : Money.from(totalCommissions);
    this._netRevenue = netRevenue instanceof Money ? netRevenue : Money.from(netRevenue);
    this._availableBalance = availableBalance instanceof Money ? availableBalance : Money.from(availableBalance);
    this._averageOrderValue = averageOrderValue instanceof Money ? averageOrderValue : Money.from(averageOrderValue);

    this.validate();
  }

  /**
   * Factory method depuis un objet FinanceSummaryData
   */
  static from(data: FinanceSummaryData): FinanceSummary {
    return new FinanceSummary(
      data.merchantId,
      data.period,
      Money.from(data.totalRevenue),
      data.totalOrders,
      Money.from(data.averageOrderValue),
      Money.from(data.totalPayouts),
      Money.from(data.pendingPayouts),
      Money.from(data.totalFees),
      Money.from(data.totalCommissions),
      Money.from(data.netRevenue),
      Money.from(data.availableBalance),
      data.startDate,
      data.endDate,
      data.generatedAt,
      data.revenueByDay,
      data.payoutHistory,
      data.nextPayoutDate
    );
  }

  /**
   * Validation
   */
  private validate(): void {
    if (!this.merchantId || this.merchantId.trim() === '') {
      throw new Error('Merchant ID cannot be empty');
    }
    if (this.totalOrders < 0) {
      throw new Error('Total orders cannot be negative');
    }
    if (this.startDate >= this.endDate) {
      throw new Error('Start date must be before end date');
    }
  }

  /**
   * Revenus totaux
   */
  get totalRevenue(): Money {
    return this._totalRevenue;
  }

  /**
   * Versements totaux
   */
  get totalPayouts(): Money {
    return this._totalPayouts;
  }

  /**
   * Versements en attente
   */
  get pendingPayouts(): Money {
    return this._pendingPayouts;
  }

  /**
   * Frais totaux
   */
  get totalFees(): Money {
    return this._totalFees;
  }

  /**
   * Commissions totales
   */
  get totalCommissions(): Money {
    return this._totalCommissions;
  }

  /**
   * Revenus nets
   */
  get netRevenue(): Money {
    return this._netRevenue;
  }

  /**
   * Solde disponible
   */
  get availableBalance(): Money {
    return this._availableBalance;
  }

  /**
   * Valeur moyenne d'une commande
   */
  get averageOrderValue(): Money {
    return this._averageOrderValue;
  }

  /**
   * Taux de commission moyen
   */
  get averageCommissionRate(): number {
    if (this._totalRevenue.isZero) return 0;
    return (this._totalCommissions.amountMinor / this._totalRevenue.amountMinor) * 100;
  }

  /**
   * Pourcentage de revenus versés
   */
  get payoutPercentage(): number {
    if (this._netRevenue.isZero) return 0;
    return (this._totalPayouts.amountMinor / this._netRevenue.amountMinor) * 100;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): FinanceSummaryData {
    return {
      merchantId: this.merchantId,
      period: this.period,
      totalRevenue: this._totalRevenue.toJSON(),
      totalOrders: this.totalOrders,
      averageOrderValue: this._averageOrderValue.toJSON(),
      totalPayouts: this._totalPayouts.toJSON(),
      pendingPayouts: this._pendingPayouts.toJSON(),
      totalFees: this._totalFees.toJSON(),
      totalCommissions: this._totalCommissions.toJSON(),
      netRevenue: this._netRevenue.toJSON(),
      availableBalance: this._availableBalance.toJSON(),
      startDate: this.startDate,
      endDate: this.endDate,
      generatedAt: this.generatedAt,
      revenueByDay: this.revenueByDay,
      payoutHistory: this.payoutHistory,
      nextPayoutDate: this.nextPayoutDate,
    };
  }
}

