/**
 * Service: CategoryService
 * Service de gestion des catégories
 */

import { Category } from '../entities/Category';
import { CategoryType } from '../enums/CategoryType';
import { CategoryRepository } from '../repositories/CategoryRepository';

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  /**
   * Obtenir les catégories par type
   */
  async getCategories(type: CategoryType): Promise<Category[]> {
    return this.categoryRepository.getCategories(type);
  }

  /**
   * Créer une catégorie
   */
  async createCategory(category: Category): Promise<Category> {
    // Validation
    if (!category.name || category.name.trim().length === 0) {
      throw new Error('Le nom de la catégorie est requis');
    }

    return this.categoryRepository.createCategory(category);
  }

  /**
   * Mettre à jour une catégorie
   */
  async updateCategory(category: Category): Promise<void> {
    // Validation
    if (!category.name || category.name.trim().length === 0) {
      throw new Error('Le nom de la catégorie est requis');
    }

    await this.categoryRepository.updateCategory(category);
  }

  /**
   * Supprimer une catégorie
   */
  async deleteCategory(categoryId: string): Promise<void> {
    await this.categoryRepository.deleteCategory(categoryId);
  }

  /**
   * Obtenir une catégorie par ID
   */
  async getCategoryById(categoryId: string): Promise<Category | null> {
    return this.categoryRepository.getCategoryById(categoryId);
  }
}

