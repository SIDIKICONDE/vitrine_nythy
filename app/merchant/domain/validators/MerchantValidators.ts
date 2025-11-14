/**
 * Validateurs pour les Value Objects du domaine Merchant
 * 
 * ✅ DOMAIN-DRIVEN DESIGN
 * - Validation des règles métier
 * - Value Objects immutables
 */

/**
 * Valide un numéro SIRET français (14 chiffres)
 */
export function validateSiret(siret: string): boolean {
  if (!siret) return false;

  // Retirer les espaces
  const cleaned = siret.replace(/\s/g, '');

  // Doit contenir exactement 14 chiffres
  if (!/^\d{14}$/.test(cleaned)) {
    return false;
  }

  // Algorithme de Luhn pour validation du SIRET
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const char = cleaned[i];
    if (!char) return false;
    
    let digit = parseInt(char, 10);

    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

/**
 * Valide un IBAN (International Bank Account Number)
 */
export function validateIban(iban: string): boolean {
  if (!iban) return false;

  // Retirer les espaces et mettre en majuscules
  const cleaned = iban.replace(/\s/g, '').toUpperCase();

  // Format de base: 2 lettres + 2 chiffres + jusqu'à 30 caractères alphanumériques
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleaned)) {
    return false;
  }

  // Longueur entre 15 et 34 caractères
  if (cleaned.length < 15 || cleaned.length > 34) {
    return false;
  }

  // Validation spécifique pour les IBAN français (27 caractères)
  if (cleaned.startsWith('FR')) {
    return cleaned.length === 27;
  }

  // Validation mod-97 (simplifiée)
  return true; // TODO: Implémenter la validation complète mod-97
}

/**
 * Valide un code BIC/SWIFT (8 ou 11 caractères)
 */
export function validateBic(bic: string): boolean {
  if (!bic) return false;

  // Retirer les espaces et mettre en majuscules
  const cleaned = bic.replace(/\s/g, '').toUpperCase();

  // Format: 4 lettres (banque) + 2 lettres (pays) + 2 caractères (localisation) + 3 caractères optionnels (branche)
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(cleaned);
}

/**
 * Valide une adresse email
 */
export function validateEmail(email: string): boolean {
  if (!email) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valide un numéro de téléphone (format international E.164)
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;

  // Retirer les espaces, tirets, parenthèses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Format E.164: +[code pays][numéro] (max 15 chiffres)
  return /^\+?[1-9]\d{1,14}$/.test(cleaned);
}

/**
 * Valide une URL
 */
export function validateUrl(url: string): boolean {
  if (!url) return false;

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Valide des coordonnées GPS
 */
export function validateCoordinates(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

/**
 * Valide un code postal français
 */
export function validateFrenchPostalCode(postalCode: string): boolean {
  if (!postalCode) return false;

  // Format: 5 chiffres
  return /^\d{5}$/.test(postalCode);
}

