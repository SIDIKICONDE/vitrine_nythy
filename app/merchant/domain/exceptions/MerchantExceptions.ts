/**
 * Exceptions du domaine Merchant
 * 
 * ✅ ARCHITECTURE DDD
 * - Exceptions métier spécifiques au domaine
 */

/**
 * Exception levée quand un commerçant n'est pas trouvé
 */
export class MerchantNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MerchantNotFoundException';
  }
}

/**
 * Exception levée lors d'une erreur de validation
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Exception levée lors d'un accès non autorisé
 */
export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

/**
 * Exception levée lors d'une erreur métier
 */
export class BusinessRuleViolationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleViolationError';
  }
}
