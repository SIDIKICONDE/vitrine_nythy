/**
 * Types et interfaces pour les marchands
 * Architecture portée de Flutter vers TypeScript
 */

import { MerchantStatus, MerchantType, PriceLevel, VerificationStatus } from './merchant-enums';

// ========================================
// VALUE OBJECTS
// ========================================

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface MerchantAddress {
  street: string;
  postalCode: string;
  city: string;
  countryCode: string; // ISO 3166-1 alpha-2 (ex: "FR")
  location: GeoLocation;
}

export interface ContactInfo {
  email: string;
  phone: string;
  website?: string;
}

export interface MerchantSocials {
  instagram?: string;
  facebook?: string;
  tiktok?: string;
}

export interface TimeSlot {
  open: string;  // Format HH:mm (ex: "09:00")
  close: string; // Format HH:mm (ex: "18:30")
}

export interface OperatingHours {
  [key: string]: TimeSlot[] | null; // null = fermé ce jour
}

export interface MerchantDeliveryOptions {
  inStorePickup: boolean;
  localDelivery: boolean;
  deliveryRadius?: number; // en km
  deliveryFee?: number;
  minOrderForDelivery?: number;
}

export interface MerchantCompliance {
  vatNumber?: string;
  foodSafetyCertNumber?: string;
  certExpiry?: Date;
}

export interface MerchantKycDocs {
  businessRegistrationDocUrl?: string;
  ownerIdDocUrl?: string;
}

export interface MerchantStats {
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  followersCount: number;
  productsCount: number;
  savedItemsCount: number;
  co2Saved: number; // kg de CO2 économisés
}

export interface MerchantSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy: {
    showPhone: boolean;
    showEmail: boolean;
    showAddress: boolean;
  };
  preferences: {
    language: string; // ISO 639-1 (ex: "fr")
    currency: string; // ISO 4217 (ex: "EUR")
    timezone: string; // IANA TZ database (ex: "Europe/Paris")
  };
}

// ========================================
// ENTITÉ PRINCIPALE - MERCHANT
// ========================================

export interface Merchant {
  // Identification
  id: string;
  ownerUserId: string;

  // Informations commerciales
  businessName: string;       // Nom commercial
  legalName: string;          // Raison sociale
  siret: string;              // SIRET (France) ou équivalent
  merchantType: MerchantType;
  description?: string;

  // Statut et vérification
  status: MerchantStatus;
  verificationStatus: VerificationStatus;
  verifiedAt?: Date;

  // Contact et localisation
  address: MerchantAddress;
  contactInfo: ContactInfo;
  socials?: MerchantSocials;

  // Images
  logoUrl?: string;
  bannerUrl?: string;
  gallery: string[];

  // Horaires et livraison
  operatingHours?: OperatingHours;
  deliveryOptions: MerchantDeliveryOptions;
  pickupInstructions?: string;
  averagePrepTimeMinutes: number;

  // Pricing et langues
  priceLevel?: PriceLevel;
  languages: string[]; // ISO 639-1
  acceptsSurpriseBox: boolean;

  // Compliance et documents
  compliance?: MerchantCompliance;
  kycDocs?: MerchantKycDocs;

  // Statistiques
  stats: MerchantStats;

  // Configuration
  settings: MerchantSettings;

  // Métadonnées
  createdAt: Date;
  updatedAt: Date;
  termsAcceptedAt?: Date;
}

// ========================================
// DONNÉES D'INSCRIPTION
// ========================================

export interface MerchantRegistrationData {
  // Obligatoires
  ownerUserId: string;
  businessName: string;
  legalName: string;
  siret: string;
  merchantType: MerchantType;
  countryCode: string;

  // Adresse
  street: string;
  postalCode: string;
  city: string;
  latitude: number;
  longitude: number;

  // Contact
  contactEmail: string;
  phone: string;

  // Recommandés
  description?: string;
  website?: string;
  socials?: MerchantSocials;
  priceLevel?: PriceLevel;
  logoUrl?: string;
  bannerUrl?: string;
  gallery?: string[];

  // Options
  pickupInstructions?: string;
  acceptsSurpriseBox?: boolean;
  languages?: string[];
  preferredCurrency?: string;
  timezone?: string;

  // Livraison
  inStorePickup?: boolean;
  localDelivery?: boolean;
  deliveryRadius?: number;
  deliveryFee?: number;

  // Compliance
  vatNumber?: string;
  foodSafetyCertNumber?: string;

  // Documents KYC
  businessRegistrationDocUrl?: string;
  ownerIdDocUrl?: string;

  // Consentement
  termsAccepted: boolean;
}

// ========================================
// DONNÉES DE MISE À JOUR
// ========================================

export interface MerchantUpdateData {
  // Informations commerciales
  businessName?: string;
  legalName?: string;
  siret?: string;
  merchantType?: MerchantType;
  description?: string;

  // Contact et localisation
  address?: Partial<MerchantAddress>;
  contactInfo?: Partial<ContactInfo>;
  socials?: MerchantSocials;

  // Horaires et livraison
  operatingHours?: OperatingHours;
  deliveryOptions?: Partial<MerchantDeliveryOptions>;
  pickupInstructions?: string;

  // Images
  priceLevel?: PriceLevel;
  logoUrl?: string;
  logo_url?: string; // Alias pour compatibilité
  bannerUrl?: string;
  banner_url?: string; // Alias pour compatibilité
  imageUrls?: string[]; // URLs d'images (pour compatibilité Flutter)
  gallery?: string[];

  // Paramètres
  settings?: Partial<MerchantSettings>;

  // Extensions pour les paiements (TODO: créer un PaymentInfo value object)
  iban?: string;
  bic?: string;
  paymentPreference?: 'weekly' | 'biweekly' | 'manual';

  // Metadata
  updatedAt?: Date;
}

// ========================================
// RÉPONSES API
// ========================================

export interface MerchantRegistrationResponse {
  success: boolean;
  merchantId: string;
  status: MerchantStatus;
  message?: string;
}

export interface MerchantResponse {
  success: boolean;
  merchant?: Merchant;
  error?: string;
}

export interface MerchantsListResponse {
  success: boolean;
  merchants: Merchant[];
  total: number;
  page: number;
  limit: number;
}

// ========================================
// FILTRES ET RECHERCHE
// ========================================

export interface MerchantSearchFilters {
  query?: string;
  merchantType?: MerchantType;
  priceLevel?: PriceLevel;
  status?: MerchantStatus;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  minRating?: number;
  acceptsSurpriseBox?: boolean;
  hasDelivery?: boolean;
  isOpen?: boolean;
}

export interface MerchantSearchParams extends MerchantSearchFilters {
  page?: number;
  limit?: number;
  sortBy?: 'distance' | 'rating' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

