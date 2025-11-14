/**
 * NetworkExceptions - Exceptions liées au réseau
 */

/**
 * Erreur réseau lors d'accès aux données commerçant
 */
export class MerchantNetworkException extends Error {
  constructor(message: string = 'Erreur réseau') {
    super(message);
    this.name = 'MerchantNetworkException';
  }
}

/**
 * Limite de taux atteinte pour les requêtes commerçant
 */
export class MerchantRateLimitException extends Error {
  constructor(message: string = 'Trop de requêtes') {
    super(message);
    this.name = 'MerchantRateLimitException';
  }
}

/**
 * Erreur d'upload de fichier
 */
export class MerchantUploadException extends Error {
  constructor(message: string = 'Erreur lors de l\'upload') {
    super(message);
    this.name = 'MerchantUploadException';
  }
}

/**
 * Recherche invalide
 */
export class InvalidSearchException extends Error {
  constructor(message: string = 'Recherche invalide') {
    super(message);
    this.name = 'InvalidSearchException';
  }
}

