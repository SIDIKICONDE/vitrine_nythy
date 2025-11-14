/**
 * Base: DomainEvent
 * Classe de base pour tous les événements du domaine
 */

export abstract class DomainEvent {
  public readonly occurredAt: Date;

  constructor(occurredAt?: Date) {
    this.occurredAt = occurredAt || new Date();
  }

  /**
   * ID de l'agrégat qui a émis l'événement
   */
  abstract get aggregateId(): string;

  /**
   * Nom de l'événement (ex: 'merchant.verified')
   */
  abstract get eventName(): string;

  /**
   * Convertir en objet simple pour persistence
   */
  toJSON(): Record<string, unknown> {
    return {
      eventName: this.eventName,
      aggregateId: this.aggregateId,
      occurredAt: this.occurredAt.toISOString(),
    };
  }
}

