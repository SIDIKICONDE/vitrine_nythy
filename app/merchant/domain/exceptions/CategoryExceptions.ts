/**
 * CategoryExceptions - Exceptions liées aux catégories
 */

/**
 * Catégorie introuvable
 */
export class CategoryNotFoundException extends Error {
  constructor(message: string = 'Catégorie introuvable') {
    super(message);
    this.name = 'CategoryNotFoundException';
  }
}

/**
 * Catégorie déjà existante
 */
export class CategoryAlreadyExistsException extends Error {
  constructor(message: string = 'Catégorie déjà existante') {
    super(message);
    this.name = 'CategoryAlreadyExistsException';
  }
}

/**
 * Catégorie en cours d'utilisation (ne peut pas être supprimée)
 */
export class CategoryInUseException extends Error {
  constructor(
    public readonly usageCount: number,
    message?: string
  ) {
    super(message || `Catégorie utilisée par ${usageCount} élément(s), suppression impossible`);
    this.name = 'CategoryInUseException';
  }
}

/**
 * Erreur dans la hiérarchie des catégories
 */
export class CategoryHierarchyException extends Error {
  constructor(message: string = 'Erreur de hiérarchie des catégories') {
    super(message);
    this.name = 'CategoryHierarchyException';
  }
}

/**
 * Erreur de validation spécifique aux catégories
 */
export class CategoryValidationException extends Error {
  constructor(message: string = 'Validation de catégorie échouée') {
    super(message);
    this.name = 'CategoryValidationException';
  }
}

/**
 * Catégorie parente ne peut pas avoir d'enfants
 */
export class CategoryChildNotAllowedException extends Error {
  constructor(message: string = 'Cette catégorie ne peut pas avoir d\'enfants') {
    super(message);
    this.name = 'CategoryChildNotAllowedException';
  }
}

/**
 * Cycle détecté dans la hiérarchie des catégories
 */
export class CategoryCycleDetectedException extends Error {
  constructor(message: string = 'Cycle détecté dans la hiérarchie') {
    super(message);
    this.name = 'CategoryCycleDetectedException';
  }
}

