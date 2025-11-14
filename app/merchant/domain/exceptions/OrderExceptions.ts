/**
 * Exceptions du domaine Order
 */

/**
 * Exception de base pour les commandes
 */
export abstract class OrderException extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, OrderException.prototype);
  }
}

/**
 * Commande introuvable
 */
export class OrderNotFoundException extends OrderException {
  constructor(message: string = 'Commande introuvable') {
    super(message, 'ORDER_NOT_FOUND');
  }
}

/**
 * Erreur de permission
 */
export class OrderPermissionException extends OrderException {
  constructor(message: string = 'Autorisation insuffisante') {
    super(message, 'ORDER_PERMISSION_DENIED');
  }
}

/**
 * Statut invalide
 */
export class OrderInvalidStatusException extends OrderException {
  constructor(message: string = 'Statut de commande invalide') {
    super(message, 'ORDER_INVALID_STATUS');
  }
}

/**
 * Erreur réseau
 */
export class OrderNetworkException extends OrderException {
  constructor(message: string = 'Erreur réseau') {
    super(message, 'ORDER_NETWORK_ERROR');
  }
}

