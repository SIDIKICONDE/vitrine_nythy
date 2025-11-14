/**
 * Entité: MerchantProduct
 * Produit anti-gaspillage avec prix original et prix réduit
 */

import { DietaryTag } from '../enums/DietaryTag';
import { ProductStatus } from '../enums/ProductStatus';
import { Money, MoneyData } from '../value-objects/Money';

export interface MerchantProductData {
  id: string;
  merchantId: string;
  title: string;
  description?: string;
  originalPrice: MoneyData;
  discountedPrice: MoneyData;
  quantity: number;
  pickupStart: Date;
  pickupEnd: Date;
  dietaryTags: DietaryTag[];
  allergenTags: string[];
  isSurpriseBox: boolean;
  category?: string;
  imageUrls: string[];
  status: ProductStatus;
  // 🌍 Métadonnées anti-gaspillage
  weightGrams?: number;
  co2SavedGrams?: number;
  pickupInstructions?: string;
  surpriseDescription?: string;
  sku?: string;
  maxPerUser?: number;
  expiresAt?: Date;
}

export class MerchantProduct {
  private _originalPrice: Money;
  private _discountedPrice: Money;

  constructor(
    public readonly id: string,
    public readonly merchantId: string,
    public readonly title: string,
    public readonly description?: string,
    originalPrice?: Money | MoneyData,
    discountedPrice?: Money | MoneyData,
    public readonly quantity: number = 1,
    public readonly pickupStart: Date = new Date(),
    public readonly pickupEnd: Date = new Date(),
    public readonly dietaryTags: DietaryTag[] = [],
    public readonly allergenTags: string[] = [],
    public readonly isSurpriseBox: boolean = false,
    public readonly category?: string,
    public readonly imageUrls: string[] = [],
    public readonly status: ProductStatus = ProductStatus.AVAILABLE,
    // 🌍 Métadonnées anti-gaspillage
    public readonly weightGrams?: number,
    public readonly co2SavedGrams?: number,
    public readonly pickupInstructions?: string,
    public readonly surpriseDescription?: string,
    public readonly sku?: string,
    public readonly maxPerUser?: number,
    public readonly expiresAt?: Date
  ) {
    // Gérer originalPrice
    if (originalPrice instanceof Money) {
      this._originalPrice = originalPrice;
    } else if (originalPrice) {
      this._originalPrice = Money.from(originalPrice);
    } else {
      throw new Error('Le prix original est requis');
    }

    // Gérer discountedPrice
    if (discountedPrice instanceof Money) {
      this._discountedPrice = discountedPrice;
    } else if (discountedPrice) {
      this._discountedPrice = Money.from(discountedPrice);
    } else {
      throw new Error('Le prix réduit est requis');
    }

    this.validate();
  }

  /**
   * Factory method depuis un objet MerchantProductData
   */
  static from(data: MerchantProductData): MerchantProduct {
    return new MerchantProduct(
      data.id,
      data.merchantId,
      data.title,
      data.description,
      Money.from(data.originalPrice),
      Money.from(data.discountedPrice),
      data.quantity,
      data.pickupStart,
      data.pickupEnd,
      data.dietaryTags,
      data.allergenTags,
      data.isSurpriseBox,
      data.category,
      data.imageUrls,
      data.status,
      data.weightGrams,
      data.co2SavedGrams,
      data.pickupInstructions,
      data.surpriseDescription,
      data.sku,
      data.maxPerUser,
      data.expiresAt
    );
  }

  /**
   * Validation des invariants métier
   */
  private validate(): void {
    // Prix réduit < prix original
    if (!this._discountedPrice.lessThan(this._originalPrice)) {
      throw new Error(
        'Le prix réduit doit être inférieur au prix original'
      );
    }

    // Dates de retrait cohérentes
    if (this.pickupStart >= this.pickupEnd) {
      throw new Error(
        'La date de début de retrait doit être avant la date de fin'
      );
    }

    // Quantité positive
    if (this.quantity <= 0) {
      throw new Error('La quantité doit être positive');
    }
  }

  /**
   * Prix original
   */
  get originalPrice(): Money {
    return this._originalPrice;
  }

  /**
   * Prix réduit
   */
  get discountedPrice(): Money {
    return this._discountedPrice;
  }

  /**
   * Pourcentage de réduction
   */
  get discountPercentage(): number {
    const original = this._originalPrice.amountDecimal;
    const discounted = this._discountedPrice.amountDecimal;
    return Math.round(((original - discounted) / original) * 100);
  }

  /**
   * Montant des économies
   */
  get savingsAmount(): Money {
    return this._originalPrice.subtract(this._discountedPrice);
  }

  /**
   * Disponible maintenant
   */
  get isAvailableNow(): boolean {
    const now = new Date();
    return (
      this.status === ProductStatus.AVAILABLE &&
      now >= this.pickupStart &&
      now <= this.pickupEnd &&
      this.quantity > 0
    );
  }

  /**
   * Retrait aujourd'hui
   */
  get isPickupToday(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pickupStart = new Date(this.pickupStart);
    pickupStart.setHours(0, 0, 0, 0);
    return pickupStart.getTime() === today.getTime();
  }

  /**
   * Poids formaté
   */
  get formattedWeight(): string | undefined {
    if (!this.weightGrams) {
      return undefined;
    }
    if (this.weightGrams >= 1000) {
      return `${(this.weightGrams / 1000).toFixed(1)}kg`;
    }
    return `${Math.round(this.weightGrams)}g`;
  }

  /**
   * CO2 économisé formaté
   */
  get formattedCo2Saved(): string | undefined {
    if (!this.co2SavedGrams) {
      return undefined;
    }
    if (this.co2SavedGrams >= 1000) {
      return `${(this.co2SavedGrams / 1000).toFixed(1)}kg de CO2`;
    }
    return `${Math.round(this.co2SavedGrams)}g de CO2`;
  }

  /**
   * Vérifier si le produit est expiré
   */
  get isExpired(): boolean {
    if (!this.expiresAt) {
      return false;
    }
    return new Date() > this.expiresAt;
  }

  /**
   * Temps restant avant expiration
   */
  get timeUntilExpiration(): number | undefined {
    if (!this.expiresAt) {
      return undefined;
    }
    const diff = this.expiresAt.getTime() - new Date().getTime();
    return diff > 0 ? diff : 0;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): MerchantProductData {
    return {
      id: this.id,
      merchantId: this.merchantId,
      title: this.title,
      description: this.description,
      originalPrice: this._originalPrice.toJSON(),
      discountedPrice: this._discountedPrice.toJSON(),
      quantity: this.quantity,
      pickupStart: this.pickupStart,
      pickupEnd: this.pickupEnd,
      dietaryTags: this.dietaryTags,
      allergenTags: this.allergenTags,
      isSurpriseBox: this.isSurpriseBox,
      category: this.category,
      imageUrls: this.imageUrls,
      status: this.status,
      weightGrams: this.weightGrams,
      co2SavedGrams: this.co2SavedGrams,
      pickupInstructions: this.pickupInstructions,
      surpriseDescription: this.surpriseDescription,
      sku: this.sku,
      maxPerUser: this.maxPerUser,
      expiresAt: this.expiresAt,
    };
  }
}

