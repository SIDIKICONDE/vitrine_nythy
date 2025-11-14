/**
 * Entité: Transaction
 * Transaction financière (revenu, versement, commission, etc.)
 * 
 * ✅ ARCHITECTURE DDD
 * - Entité du domaine avec invariants
 * - Value Objects (Money)
 * - Règles métier
 */

import { Money, MoneyData } from '../value-objects/Money';

export enum TransactionType {
  REVENUE = 'revenue',           // Revenu d'une commande
  PAYOUT = 'payout',             // Versement au commerçant
  COMMISSION = 'commission',     // Commission Nythy
  REFUND = 'refund',            // Remboursement
  FEE = 'fee',                  // Frais
}

export enum TransactionStatus {
  PENDING = 'pending',           // En attente
  PROCESSING = 'processing',     // En cours de traitement
  COMPLETED = 'completed',       // Complétée
  FAILED = 'failed',            // Échouée
  CANCELLED = 'cancelled',       // Annulée
}

export interface TransactionData {
  id: string;
  merchantId: string;
  orderId?: string;              // ID de la commande associée (si applicable)
  type: TransactionType;
  status: TransactionStatus;
  amount: MoneyData;              // Montant (positif pour revenu, négatif pour versement)
  fee?: MoneyData;                // Frais (si applicable)
  netAmount: MoneyData;           // Montant net (après frais)
  description?: string;
  metadata?: Record<string, any>; // Données supplémentaires
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
}

export class Transaction {
  private _amount: Money;
  private _fee?: Money;
  private _netAmount: Money;

  constructor(
    public readonly id: string,
    public readonly merchantId: string,
    public readonly type: TransactionType,
    public readonly status: TransactionStatus,
    amount: Money | MoneyData,
    public readonly orderId?: string,
    fee?: Money | MoneyData,
    netAmount?: Money | MoneyData,
    public readonly description?: string,
    public readonly metadata?: Record<string, any>,
    public readonly createdAt: Date = new Date(),
    public readonly processedAt?: Date,
    public readonly completedAt?: Date,
    public readonly failureReason?: string
  ) {
    // Gérer amount
    if (amount instanceof Money) {
      this._amount = amount;
    } else {
      this._amount = Money.from(amount);
    }

    // Gérer fee
    if (fee) {
      if (fee instanceof Money) {
        this._fee = fee;
      } else {
        this._fee = Money.from(fee);
      }
    }

    // Gérer netAmount
    if (netAmount) {
      if (netAmount instanceof Money) {
        this._netAmount = netAmount;
      } else {
        this._netAmount = Money.from(netAmount);
      }
    } else {
      // Calculer automatiquement si non fourni
      this._netAmount = this._fee 
        ? this._amount.subtract(this._fee)
        : this._amount;
    }

    this.validate();
  }

  /**
   * Factory method depuis un objet TransactionData
   */
  static from(data: TransactionData): Transaction {
    return new Transaction(
      data.id,
      data.merchantId,
      data.type,
      data.status,
      Money.from(data.amount),
      data.orderId,
      data.fee ? Money.from(data.fee) : undefined,
      Money.from(data.netAmount),
      data.description,
      data.metadata,
      data.createdAt,
      data.processedAt,
      data.completedAt,
      data.failureReason
    );
  }

  /**
   * Validation des invariants
   */
  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('Transaction ID cannot be empty');
    }
    if (!this.merchantId || this.merchantId.trim() === '') {
      throw new Error('Merchant ID cannot be empty');
    }

    // Validation selon le type
    if (this.type === TransactionType.REVENUE && this._amount.isNegative) {
      throw new Error('Revenue amount cannot be negative');
    }
    if (this.type === TransactionType.PAYOUT && this._amount.isPositive) {
      throw new Error('Payout amount should be negative or zero');
    }

    // Validation du montant net
    // Pour les revenus: netAmount <= amount (positifs)
    // Pour les payouts: netAmount >= amount (négatifs, donc -498 > -500 est OK)
    if (this._fee) {
      if (this.type === TransactionType.REVENUE && this._netAmount.greaterThan(this._amount)) {
        throw new Error('Net revenue cannot be greater than gross revenue');
      }
      if (this.type === TransactionType.PAYOUT && this._netAmount.lessThan(this._amount)) {
        throw new Error('Net payout cannot be less than gross payout');
      }
    }
  }

  /**
   * Montant brut
   */
  get amount(): Money {
    return this._amount;
  }

  /**
   * Frais
   */
  get fee(): Money | undefined {
    return this._fee;
  }

  /**
   * Montant net
   */
  get netAmount(): Money {
    return this._netAmount;
  }

  /**
   * Est un revenu
   */
  get isRevenue(): boolean {
    return this.type === TransactionType.REVENUE;
  }

  /**
   * Est un versement
   */
  get isPayout(): boolean {
    return this.type === TransactionType.PAYOUT;
  }

  /**
   * Est complétée
   */
  get isCompleted(): boolean {
    return this.status === TransactionStatus.COMPLETED;
  }

  /**
   * Est en attente
   */
  get isPending(): boolean {
    return this.status === TransactionStatus.PENDING;
  }

  /**
   * Est échouée
   */
  get isFailed(): boolean {
    return this.status === TransactionStatus.FAILED;
  }

  /**
   * Peut être annulée
   */
  get canBeCancelled(): boolean {
    return (
      this.status === TransactionStatus.PENDING ||
      this.status === TransactionStatus.PROCESSING
    );
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): TransactionData {
    return {
      id: this.id,
      merchantId: this.merchantId,
      orderId: this.orderId,
      type: this.type,
      status: this.status,
      amount: this._amount.toJSON(),
      fee: this._fee?.toJSON(),
      netAmount: this._netAmount.toJSON(),
      description: this.description,
      metadata: this.metadata,
      createdAt: this.createdAt,
      processedAt: this.processedAt,
      completedAt: this.completedAt,
      failureReason: this.failureReason,
    };
  }
}

