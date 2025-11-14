/**
 * FavoriteExceptions - Exceptions liées aux favoris
 */

/**
 * Favori déjà existant
 */
export class FavoriteAlreadyExistsException extends Error {
  constructor(message: string = 'Commerçant déjà en favoris') {
    super(message);
    this.name = 'FavoriteAlreadyExistsException';
  }
}

/**
 * Favori introuvable
 */
export class FavoriteNotFoundException extends Error {
  constructor(message: string = 'Favori introuvable') {
    super(message);
    this.name = 'FavoriteNotFoundException';
  }
}

