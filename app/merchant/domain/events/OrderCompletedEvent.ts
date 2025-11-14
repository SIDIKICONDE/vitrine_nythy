/**
 * DomainEvent: OrderCompletedEvent
 * Événement émis lorsqu'une commande est complétée avec succès
 */

import { DomainEvent } from './DomainEvent';

export class OrderCompletedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly merchantId: string,
    public readonly merchantName: string,
    public readonly totalAmountCents: number,
    public readonly itemsCount: number,
    occurredAt?: Date
  ) {
    super(occurredAt);
  }

  get aggregateId(): string {
    return this.orderId;
  }

  get eventName(): string {
    return 'order.completed';
  }

  /**
   * Points à attribuer en fonction du nombre d'articles sauvés
   */
  get pointsToAward(): number {
    return this.itemsCount * 50; // 50 points par panier sauvé
  }

  /**
   * Calculer les récompenses anti-gaspillage
   */
  get antiWasteRewards(): {
    points: number;
    co2SavedBadge: boolean;
    firstOrderBadge: boolean;
  } {
    return {
      points: this.pointsToAward,
      co2SavedBadge: this.itemsCount >= 5,
      firstOrderBadge: false, // À calculer par le handler
    };
  }

  override toString(): string {
    return `OrderCompletedEvent(orderId: ${this.orderId}, userId: ${this.userId}, items: ${this.itemsCount})`;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      orderId: this.orderId,
      userId: this.userId,
      merchantId: this.merchantId,
      merchantName: this.merchantName,
      totalAmountCents: this.totalAmountCents,
      itemsCount: this.itemsCount,
      pointsToAward: this.pointsToAward,
    };
  }
}
