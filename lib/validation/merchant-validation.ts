/**
 * Utilitaires de validation pour les marchands
 * Portage de la logique Flutter vers TypeScript
 */

import { GeoLocation, MerchantAddress, MerchantRegistrationData } from '@/types/merchant';
import { MerchantType } from '@/types/merchant-enums';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ========================================
// VALIDATION DES CHAMPS INDIVIDUELS
// ========================================

/**
 * Valide un email
 */
export function validateEmail(email: string): string | null {
  if (!email || email.trim().length === 0) {
    return 'Email requis';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email invalide';
  }

  return null;
}

/**
 * Valide un numéro de téléphone
 */
export function validatePhone(phone: string): string | null {
  if (!phone || phone.trim().length === 0) {
    return 'Téléphone requis';
  }

  // Enlever les espaces, tirets, parenthèses
  const phoneDigits = phone.replace(/[\s\-()]/g, '');
  const digitsOnly = phoneDigits.replace(/\+/g, '');

  if (digitsOnly.length < 7 || digitsOnly.length > 20) {
    return 'Téléphone invalide (7-20 chiffres requis)';
  }

  return null;
}

/**
 * Valide un SIRET (France) - 14 chiffres
 */
export function validateSiret(siret: string): string | null {
  if (!siret || siret.trim().length === 0) {
    return 'SIRET/Numéro d\'identification requis';
  }

  // Enlever les espaces
  const siretClean = siret.replace(/\s/g, '');

  // SIRET français : 14 chiffres
  const isSiret = /^\d{14}$/.test(siretClean);

  // Fallback générique : au moins 8 caractères alphanumériques
  const isGenericId = siretClean.length >= 8;

  if (!isSiret && !isGenericId) {
    return 'SIRET invalide (14 chiffres requis) ou numéro d\'identification trop court (min 8 caractères)';
  }

  return null;
}

/**
 * Valide un code pays ISO 3166-1 alpha-2
 */
export function validateCountryCode(code: string): string | null {
  if (!code || code.trim().length === 0) {
    return 'Code pays requis';
  }

  const codeUpper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(codeUpper)) {
    return 'Code pays invalide (2 lettres ISO requises, ex: FR)';
  }

  return null;
}

/**
 * Valide un code postal
 */
export function validatePostalCode(postalCode: string): string | null {
  if (!postalCode || postalCode.trim().length === 0) {
    return 'Code postal requis';
  }

  // Accepter 3-10 caractères alphanumériques
  if (postalCode.length < 3 || postalCode.length > 10) {
    return 'Code postal invalide';
  }

  return null;
}

/**
 * Valide une URL
 */
export function validateUrl(url: string | undefined): string | null {
  if (!url || url.trim().length === 0) {
    return null; // URL optionnelle
  }

  try {
    const parsed = new URL(url);
    if (!parsed.protocol.startsWith('http')) {
      return 'URL invalide (doit commencer par http:// ou https://)';
    }
    return null;
  } catch {
    return 'URL invalide';
  }
}

/**
 * Valide une GeoLocation
 */
export function validateGeoLocation(location: GeoLocation): string | null {
  if (location.latitude == null || location.longitude == null) {
    return 'Coordonnées GPS requises';
  }

  if (location.latitude < -90 || location.latitude > 90) {
    return 'Latitude invalide (doit être entre -90 et 90)';
  }

  if (location.longitude < -180 || location.longitude > 180) {
    return 'Longitude invalide (doit être entre -180 et 180)';
  }

  return null;
}

/**
 * Valide une adresse complète
 */
export function validateAddress(address: Partial<MerchantAddress>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!address.street || address.street.trim().length === 0) {
    errors.push({ field: 'street', message: 'Adresse requise' });
  }

  if (!address.city || address.city.trim().length === 0) {
    errors.push({ field: 'city', message: 'Ville requise' });
  }

  const postalCodeError = validatePostalCode(address.postalCode || '');
  if (postalCodeError) {
    errors.push({ field: 'postalCode', message: postalCodeError });
  }

  const countryCodeError = validateCountryCode(address.countryCode || '');
  if (countryCodeError) {
    errors.push({ field: 'countryCode', message: countryCodeError });
  }

  if (address.location) {
    const locationError = validateGeoLocation(address.location);
    if (locationError) {
      errors.push({ field: 'location', message: locationError });
    }
  } else {
    errors.push({ field: 'location', message: 'Localisation GPS requise' });
  }

  return errors;
}

// ========================================
// VALIDATION COMPLÈTE DE L'INSCRIPTION
// ========================================

/**
 * Valide les données d'inscription d'un marchand
 */
export function validateMerchantRegistration(
  data: Partial<MerchantRegistrationData>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Champs obligatoires basiques
  if (!data.businessName || data.businessName.trim().length === 0) {
    errors.push({ field: 'businessName', message: 'Nom commercial requis' });
  } else if (data.businessName.trim().length < 2) {
    errors.push({ field: 'businessName', message: 'Nom commercial trop court (min 2 caractères)' });
  }

  if (!data.legalName || data.legalName.trim().length === 0) {
    errors.push({ field: 'legalName', message: 'Raison sociale requise' });
  }

  // SIRET
  const siretError = validateSiret(data.siret || '');
  if (siretError) {
    errors.push({ field: 'siret', message: siretError });
  }

  // Type de commerce
  if (!data.merchantType) {
    errors.push({ field: 'merchantType', message: 'Type de commerce requis' });
  } else if (!Object.values(MerchantType).includes(data.merchantType)) {
    errors.push({ field: 'merchantType', message: 'Type de commerce invalide' });
  }

  // Email
  const emailError = validateEmail(data.contactEmail || '');
  if (emailError) {
    errors.push({ field: 'contactEmail', message: emailError });
  }

  // Téléphone
  const phoneError = validatePhone(data.phone || '');
  if (phoneError) {
    errors.push({ field: 'phone', message: phoneError });
  }

  // Code pays
  const countryCodeError = validateCountryCode(data.countryCode || '');
  if (countryCodeError) {
    errors.push({ field: 'countryCode', message: countryCodeError });
  }

  // Adresse complète
  if (!data.street || data.street.trim().length === 0) {
    errors.push({ field: 'street', message: 'Adresse requise' });
  }

  if (!data.city || data.city.trim().length === 0) {
    errors.push({ field: 'city', message: 'Ville requise' });
  }

  const postalCodeError = validatePostalCode(data.postalCode || '');
  if (postalCodeError) {
    errors.push({ field: 'postalCode', message: postalCodeError });
  }

  // Coordonnées GPS
  if (data.latitude == null || data.longitude == null) {
    errors.push({ field: 'location', message: 'Coordonnées GPS requises' });
  } else {
    const locationError = validateGeoLocation({
      latitude: data.latitude,
      longitude: data.longitude,
    });
    if (locationError) {
      errors.push({ field: 'location', message: locationError });
    }
  }

  // Website (optionnel mais validé si présent)
  if (data.website) {
    const websiteError = validateUrl(data.website);
    if (websiteError) {
      errors.push({ field: 'website', message: websiteError });
    }
  }

  // Consentement
  if (!data.termsAccepted) {
    errors.push({
      field: 'termsAccepted',
      message: 'Vous devez accepter les conditions d\'utilisation'
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Récupère le message d'erreur pour un champ spécifique
 */
export function getFieldError(
  errors: ValidationError[],
  field: string
): string | undefined {
  return errors.find(e => e.field === field)?.message;
}

/**
 * Vérifie si un champ a une erreur
 */
export function hasFieldError(
  errors: ValidationError[],
  field: string
): boolean {
  return errors.some(e => e.field === field);
}

