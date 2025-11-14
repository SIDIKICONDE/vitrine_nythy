/**
 * Entité: Category
 * Catégorie
 */

import { CategoryType } from '../enums/CategoryType';

export interface CategoryData {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  type: CategoryType;
  displayOrder: number;
  isActive: boolean;
}

export class Category {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly emoji?: string,
    public readonly type: CategoryType = CategoryType.PRODUCT,
    public readonly displayOrder: number = 0,
    public readonly isActive: boolean = true
  ) {}

  /**
   * Factory method depuis un objet CategoryData
   */
  static from(data: CategoryData): Category {
    return new Category(
      data.id,
      data.name,
      data.description,
      data.emoji,
      data.type,
      data.displayOrder,
      data.isActive
    );
  }

  /**
   * Nom avec emoji
   */
  get displayName(): string {
    return this.emoji ? `${this.emoji} ${this.name}` : this.name;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): CategoryData {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      emoji: this.emoji,
      type: this.type,
      displayOrder: this.displayOrder,
      isActive: this.isActive,
    };
  }
}

