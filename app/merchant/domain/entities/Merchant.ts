/**
 * Entité: Merchant
 * Agrégat principal représentant un commerçant anti-gaspillage
 */

import { MerchantType } from '../enums/MerchantType';
import { PriceLevel } from '../enums/PriceLevel';
import { GeoLocation, GeoLocationValue } from '../value-objects/GeoLocation';
import { MerchantStats, MerchantStatsData } from './MerchantStats';

export interface MerchantData {
  id: string;
  name: string;
  type: MerchantType;
  description?: string;
  imageUrls: string[];
  bannerUrl?: string;
  location?: GeoLocation;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  countryCode?: string;
  tags: string[];
  priceLevel?: PriceLevel;
  phone?: string;
  websiteUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  distanceKm?: number;
  isVerified: boolean;
  isActive: boolean;
  // Nouveaux champs
  stats?: MerchantStatsData;
  email?: string;
  siret?: string;
  messageEnabled?: boolean;
  ownerUserId?: string; // 👤 Propriétaire
  iban?: string; // 💳 Paiement
  bic?: string; // 💳 Paiement
  paymentPreference?: string;
}

export class Merchant {
  private _location?: GeoLocationValue;
  private _stats?: MerchantStats;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: MerchantType,
    public readonly description?: string,
    public readonly imageUrls: string[] = [],
    public readonly bannerUrl?: string,
    location?: GeoLocation,
    public readonly addressLine1?: string,
    public readonly addressLine2?: string,
    public readonly city?: string,
    public readonly countryCode?: string,
    public readonly tags: string[] = [],
    public readonly priceLevel?: PriceLevel,
    public readonly phone?: string,
    public readonly websiteUrl?: string,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date,
    public readonly distanceKm?: number,
    public readonly isVerified: boolean = false,
    public readonly isActive: boolean = true,
    // Nouveaux champs
    stats?: MerchantStatsData,
    public readonly email?: string,
    public readonly siret?: string,
    public readonly messageEnabled: boolean = true,
    public readonly ownerUserId?: string,
    public readonly iban?: string,
    public readonly bic?: string,
    public readonly paymentPreference?: string
  ) {
    if (location) {
      this._location = GeoLocationValue.from(location);
    }
    if (stats) {
      this._stats = MerchantStats.from(stats);
    }
  }

  /**
   * Factory method depuis un objet MerchantData
   */
  static from(data: MerchantData): Merchant {
    return new Merchant(
      data.id,
      data.name,
      data.type,
      data.description,
      data.imageUrls,
      data.bannerUrl,
      data.location,
      data.addressLine1,
      data.addressLine2,
      data.city,
      data.countryCode,
      data.tags,
      data.priceLevel,
      data.phone,
      data.websiteUrl,
      data.createdAt,
      data.updatedAt,
      data.distanceKm,
      data.isVerified,
      data.isActive,
      data.stats,
      data.email,
      data.siret,
      data.messageEnabled,
      data.ownerUserId,
      data.iban,
      data.bic,
      data.paymentPreference
    );
  }

  /**
   * Adresse complète formatée
   */
  get fullAddress(): string {
    const parts: string[] = [];
    if (this.addressLine1) parts.push(this.addressLine1);
    if (this.addressLine2) parts.push(this.addressLine2);
    if (this.city) parts.push(this.city);
    if (this.countryCode) parts.push(this.countryCode);
    return parts.join(', ') || 'Adresse non disponible';
  }

  /**
   * Vérifier si le commerce est ouvert
   * TODO: Implémenter la logique basée sur les horaires
   */
  get isOpen(): boolean {
    // Placeholder - à implémenter avec les horaires d'ouverture
    return this.isActive;
  }

  /**
   * Localisation
   */
  get location(): GeoLocationValue | undefined {
    return this._location;
  }

  /**
   * Vérifier si la localisation est valide
   */
  get hasValidLocation(): boolean {
    return this._location?.isValid() ?? false;
  }

  /**
   * Statistiques du commerçant
   */
  get stats(): MerchantStats | undefined {
    return this._stats;
  }

  /**
   * SIRENE extrait du SIRET (9 premiers chiffres)
   */
  get sirene(): string | undefined {
    if (!this.siret || this.siret.length < 9) {
      return undefined;
    }
    return this.siret.substring(0, 9);
  }

  /**
   * Vérifier si le commerçant a configuré ses paiements
   */
  get hasPaymentSetup(): boolean {
    return !!(this.iban && this.bic);
  }

  /**
   * Distance formatée
   */
  get formattedDistance(): string {
    if (!this.distanceKm) {
      return '';
    }
    if (this.distanceKm < 1) {
      return '< 1 km';
    }
    if (this.distanceKm < 10) {
      return `${this.distanceKm.toFixed(1)} km`;
    }
    return `${Math.round(this.distanceKm)} km`;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): MerchantData {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      description: this.description,
      imageUrls: this.imageUrls,
      bannerUrl: this.bannerUrl,
      location: this._location?.toJSON(),
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      city: this.city,
      countryCode: this.countryCode,
      tags: this.tags,
      priceLevel: this.priceLevel,
      phone: this.phone,
      websiteUrl: this.websiteUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      distanceKm: this.distanceKm,
      isVerified: this.isVerified,
      isActive: this.isActive,
      stats: this._stats?.toJSON(),
      email: this.email,
      siret: this.siret,
      messageEnabled: this.messageEnabled,
      ownerUserId: this.ownerUserId,
      iban: this.iban,
      bic: this.bic,
      paymentPreference: this.paymentPreference,
    };
  }
}

