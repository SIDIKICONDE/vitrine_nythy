/**
 * ProductExceptions - Exceptions liées aux produits
 */

/**
 * Produit anti-gaspi non disponible
 */
export class MerchantProductUnavailableException extends Error {
  constructor(message: string = 'Produit non disponible') {
    super(message);
    this.name = 'MerchantProductUnavailableException';
  }
}

/**
 * Produit anti-gaspi introuvable
 */
export class MerchantProductNotFoundException extends Error {
  constructor(message: string = 'Produit introuvable') {
    super(message);
    this.name = 'MerchantProductNotFoundException';
  }
}

/**
 * Produit générique introuvable
 */
export class ProductNotFoundException extends Error {
  constructor(message: string = 'Produit introuvable') {
    super(message);
    this.name = 'ProductNotFoundException';
  }
}

/**
 * Erreur de validation de produit
 */
export class ProductValidationException extends Error {
  constructor(message: string = 'Validation de produit échouée') {
    super(message);
    this.name = 'ProductValidationException';
  }
}

