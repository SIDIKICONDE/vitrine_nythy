/**
 * Entité: Order
 * Commande
 */

import { Money, MoneyData } from '../value-objects/Money';
import { OrderStatus } from '../enums/OrderStatus';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: MoneyData;
  totalPrice: MoneyData;
}

export interface OrderData {
  id: string;
  userId: string;
  merchantId: string;
  items: OrderItem[];
  totalAmount: MoneyData;
  status: OrderStatus;
  createdAt: Date;
  confirmedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export class Order {
  private _totalAmount: Money;

  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly merchantId: string,
    public readonly items: OrderItem[],
    totalAmount?: Money | MoneyData,
    public readonly status: OrderStatus = OrderStatus.PENDING,
    public readonly createdAt: Date = new Date(),
    public readonly confirmedAt?: Date,
    public readonly completedAt?: Date,
    public readonly notes?: string
  ) {
    // Gérer totalAmount
    if (totalAmount instanceof Money) {
      this._totalAmount = totalAmount;
    } else if (totalAmount) {
      this._totalAmount = Money.from(totalAmount);
    } else {
      // Calculer depuis les items
      this._totalAmount = this.calculateTotal();
    }

    this.validate();
  }

  /**
   * Factory method depuis un objet OrderData
   */
  static from(data: OrderData): Order {
    return new Order(
      data.id,
      data.userId,
      data.merchantId,
      data.items,
      Money.from(data.totalAmount),
      data.status,
      data.createdAt,
      data.confirmedAt,
      data.completedAt,
      data.notes
    );
  }

  /**
   * Calculer le total depuis les items
   */
  private calculateTotal(): Money {
    if (this.items.length === 0) {
      return Money.zero();
    }

    let total = Money.zero();
    for (const item of this.items) {
      const itemTotal = Money.from(item.totalPrice);
      total = total.add(itemTotal);
    }
    return total;
  }

  /**
   * Validation
   */
  private validate(): void {
    if (this.items.length === 0) {
      throw new Error('Une commande doit contenir au moins un article');
    }
  }

  /**
   * Montant total
   */
  get totalAmount(): Money {
    return this._totalAmount;
  }

  /**
   * Peut être modifiée
   */
  get canBeModified(): boolean {
    return this.status === OrderStatus.PENDING;
  }

  /**
   * Peut être annulée
   */
  get canBeCancelled(): boolean {
    return (
      this.status === OrderStatus.PENDING ||
      this.status === OrderStatus.CONFIRMED
    );
  }

  /**
   * Est complétée
   */
  get isCompleted(): boolean {
    return this.status === OrderStatus.COMPLETED;
  }

  /**
   * Est annulée
   */
  get isCancelled(): boolean {
    return this.status === OrderStatus.CANCELLED;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): OrderData {
    return {
      id: this.id,
      userId: this.userId,
      merchantId: this.merchantId,
      items: this.items,
      totalAmount: this._totalAmount.toJSON(),
      status: this.status,
      createdAt: this.createdAt,
      confirmedAt: this.confirmedAt,
      completedAt: this.completedAt,
      notes: this.notes,
    };
  }
}

