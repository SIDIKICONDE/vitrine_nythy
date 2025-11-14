/**
 * Entité MerchantEvent - Événement marchand
 * Représente un événement lié à un commerçant (promotion, événement spécial, etc.)
 */

export interface MerchantEvent {
  id: string;
  merchantId: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  imageUrl?: string;
  isActive: boolean;
  eventType: 'promotion' | 'special-offer' | 'announcement' | 'event';
  createdAt: Date;
  updatedAt?: Date;
}

export class MerchantEventEntity implements MerchantEvent {
  constructor(
    public readonly id: string,
    public readonly merchantId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly imageUrl: string | undefined,
    public readonly isActive: boolean,
    public readonly eventType: 'promotion' | 'special-offer' | 'announcement' | 'event',
    public readonly createdAt: Date,
    public readonly updatedAt?: Date
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim() === '') {
      throw new Error('Event ID cannot be empty');
    }
    if (!this.merchantId || this.merchantId.trim() === '') {
      throw new Error('Merchant ID cannot be empty');
    }
    if (!this.title || this.title.trim() === '') {
      throw new Error('Event title cannot be empty');
    }
    if (this.startDate >= this.endDate) {
      throw new Error('Start date must be before end date');
    }
  }

  /**
   * Vérifier si l'événement est en cours
   */
  get isOngoing(): boolean {
    const now = new Date();
    return this.isActive && this.startDate <= now && this.endDate >= now;
  }

  /**
   * Vérifier si l'événement est à venir
   */
  get isUpcoming(): boolean {
    const now = new Date();
    return this.isActive && this.startDate > now;
  }

  /**
   * Vérifier si l'événement est terminé
   */
  get isExpired(): boolean {
    const now = new Date();
    return this.endDate < now;
  }

  /**
   * Durée de l'événement en jours
   */
  get durationDays(): number {
    const diffTime = this.endDate.getTime() - this.startDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Créer à partir d'un objet simple
   */
  static fromJson(json: any): MerchantEventEntity {
    return new MerchantEventEntity(
      json.id,
      json.merchantId || json.merchant_id,
      json.title,
      json.description,
      new Date(json.startDate || json.start_date),
      new Date(json.endDate || json.end_date),
      json.imageUrl || json.image_url,
      json.isActive ?? json.is_active ?? true,
      json.eventType || json.event_type || 'event',
      new Date(json.createdAt || json.created_at),
      json.updatedAt ? new Date(json.updatedAt) : undefined
    );
  }

  /**
   * Convertir en objet simple
   */
  toJson(): any {
    return {
      id: this.id,
      merchant_id: this.merchantId,
      title: this.title,
      description: this.description,
      start_date: this.startDate.toISOString(),
      end_date: this.endDate.toISOString(),
      image_url: this.imageUrl,
      is_active: this.isActive,
      event_type: this.eventType,
      created_at: this.createdAt.toISOString(),
      updated_at: this.updatedAt?.toISOString(),
    };
  }
}

