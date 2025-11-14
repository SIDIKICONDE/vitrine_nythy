/**
 * Entité MerchantRegistration - Inscription marchand
 * Représente les données d'inscription d'un nouveau commerçant
 */

import { MerchantType } from '../enums/MerchantType';

export interface MerchantRegistration {
  email: string;
  password: string;
  businessName: string;
  merchantType: MerchantType;
  taxId: string; // SIRET, etc.
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  postalCode: string;
  countryCode: string;
  description?: string;
  websiteUrl?: string;
}

export class MerchantRegistrationEntity implements MerchantRegistration {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly businessName: string,
    public readonly merchantType: MerchantType,
    public readonly taxId: string,
    public readonly phone: string,
    public readonly addressLine1: string,
    public readonly city: string,
    public readonly postalCode: string,
    public readonly countryCode: string = 'FR',
    public readonly addressLine2?: string,
    public readonly description?: string,
    public readonly websiteUrl?: string
  ) {
    this.validate();
  }

  private validate(): void {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('Invalid email address');
    }

    // Password validation (minimum 12 characters)
    if (this.password.length < 12) {
      throw new Error('Password must be at least 12 characters long');
    }

    // Business name validation
    if (!this.businessName || this.businessName.trim().length === 0) {
      throw new Error('Business name cannot be empty');
    }

    // Tax ID validation (SIRET format for France: 14 digits)
    if (this.countryCode === 'FR' && !/^\d{14}$/.test(this.taxId)) {
      throw new Error('Invalid SIRET number (must be 14 digits)');
    }

    // Phone validation (basic)
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    if (!phoneRegex.test(this.phone)) {
      throw new Error('Invalid phone number');
    }

    // Address validation
    if (!this.addressLine1 || this.addressLine1.trim().length === 0) {
      throw new Error('Address line 1 cannot be empty');
    }

    if (!this.city || this.city.trim().length === 0) {
      throw new Error('City cannot be empty');
    }

    // Postal code validation (France: 5 digits)
    if (this.countryCode === 'FR' && !/^\d{5}$/.test(this.postalCode)) {
      throw new Error('Invalid postal code (must be 5 digits for France)');
    }
  }

  /**
   * Obtenir l'adresse complète formatée
   */
  get fullAddress(): string {
    const parts = [
      this.addressLine1,
      this.addressLine2,
      `${this.postalCode} ${this.city}`,
      this.countryCode,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Vérifier si les informations sont complètes
   */
  get isComplete(): boolean {
    return !!(
      this.email &&
      this.password &&
      this.businessName &&
      this.merchantType &&
      this.taxId &&
      this.phone &&
      this.addressLine1 &&
      this.city &&
      this.postalCode
    );
  }

  /**
   * Créer à partir d'un objet simple
   */
  static fromJson(json: any): MerchantRegistrationEntity {
    return new MerchantRegistrationEntity(
      json.email,
      json.password,
      json.businessName || json.business_name,
      json.merchantType || json.merchant_type,
      json.taxId || json.tax_id,
      json.phone,
      json.addressLine1 || json.address_line1,
      json.city,
      json.postalCode || json.postal_code,
      json.countryCode || json.country_code || 'FR',
      json.addressLine2 || json.address_line2,
      json.description,
      json.websiteUrl || json.website_url
    );
  }

  /**
   * Convertir en objet simple (sans le mot de passe)
   */
  toJson(includePassword: boolean = false): any {
    const data: any = {
      email: this.email,
      business_name: this.businessName,
      merchant_type: this.merchantType,
      tax_id: this.taxId,
      phone: this.phone,
      address_line1: this.addressLine1,
      city: this.city,
      postal_code: this.postalCode,
      country_code: this.countryCode,
    };

    if (includePassword) {
      data.password = this.password;
    }

    if (this.addressLine2) {
      data.address_line2 = this.addressLine2;
    }

    if (this.description) {
      data.description = this.description;
    }

    if (this.websiteUrl) {
      data.website_url = this.websiteUrl;
    }

    return data;
  }
}

