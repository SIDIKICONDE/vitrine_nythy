/**
 * Repository: CategoryRepository
 * Interface pour la persistance des catégories
 */

import { Category, CategoryType } from '../entities/Category';

export interface CategoryRepository {
  getCategories(type?: CategoryType): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | null>;
  createCategory(category: Category): Promise<Category>;
  updateCategory(category: Category): Promise<void>;
  deleteCategory(id: string): Promise<void>;
}

