/**
 * CategoryUsecases - Cas d'usage pour les catégories
 * Fichier groupé contenant tous les use cases liés aux catégories
 */

import { Category } from '../entities/Category';
import { CategoryType } from '../enums/CategoryType';
import { CategoryRepository } from '../repositories/CategoryRepository';

/**
 * GetCategoriesUseCase - Obtenir les catégories
 */
export class GetCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) { }

  async execute(type?: CategoryType): Promise<Category[]> {
    return await this.categoryRepository.getCategories(type);
  }
}

/**
 * GetCategoryByIdUseCase - Obtenir une catégorie par ID
 */
export class GetCategoryByIdUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) { }

  async execute(categoryId: string): Promise<Category | null> {
    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    return await this.categoryRepository.getCategoryById(categoryId);
  }
}

/**
 * CreateCategoryUseCase - Créer une catégorie
 */
export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) { }

  async execute(category: Category): Promise<string> {
    if (!category.name || category.name.trim() === '') {
      throw new Error('Category name is required');
    }

    await this.categoryRepository.createCategory(category);
    return category.id;
  }
}

/**
 * UpdateCategoryUseCase - Mettre à jour une catégorie
 */
export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) { }

  async execute(categoryId: string, updates: Partial<Category>): Promise<void> {
    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    const existingCategory = await this.categoryRepository.getCategoryById(categoryId);
    if (!existingCategory) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    const updatedCategory = Category.from({
      id: existingCategory.id,
      name: updates.name ?? existingCategory.name,
      description: updates.description ?? existingCategory.description,
      emoji: updates.emoji ?? existingCategory.emoji,
      type: (updates as any).type ?? existingCategory.type,
      displayOrder: (updates as any).displayOrder ?? existingCategory.displayOrder,
      isActive: (updates as any).isActive ?? existingCategory.isActive,
    });

    await this.categoryRepository.updateCategory(updatedCategory);
  }
}

/**
 * DeleteCategoryUseCase - Supprimer une catégorie
 */
export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) { }

  async execute(categoryId: string): Promise<void> {
    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    const category = await this.categoryRepository.getCategoryById(categoryId);
    if (!category) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }

    await this.categoryRepository.deleteCategory(categoryId);
  }
}

