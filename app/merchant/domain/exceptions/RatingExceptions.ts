/**
 * RatingExceptions - Exceptions liées à la notation
 */

/**
 * Action de notation non autorisée
 */
export class MerchantRatingNotAllowedException extends Error {
  constructor(message: string = 'Notation non autorisée') {
    super(message);
    this.name = 'MerchantRatingNotAllowedException';
  }
}

/**
 * Notation invalide (valeur hors limites)
 */
export class InvalidRatingException extends Error {
  constructor(message: string = 'Note invalide (doit être entre 1 et 5)') {
    super(message);
    this.name = 'InvalidRatingException';
  }
}

/**
 * L'utilisateur a déjà noté ce commerçant
 */
export class AlreadyRatedException extends Error {
  constructor(message: string = 'Vous avez déjà noté ce commerçant') {
    super(message);
    this.name = 'AlreadyRatedException';
  }
}

