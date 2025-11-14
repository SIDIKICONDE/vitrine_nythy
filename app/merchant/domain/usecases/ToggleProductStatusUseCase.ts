/**
 * ToggleProductStatusUseCase - Activer/Désactiver un produit
 */

import { ProductRepository } from '../repositories/ProductRepository';

export class ToggleProductStatusUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(productId: string, isActive: boolean): Promise<void> {
    if (!productId || productId.trim() === '') {
      throw new Error('Product ID is required');
    }

    // Vérifier que le produit existe
    const product = await this.productRepository.getProductById(productId);
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    await this.productRepository.toggleProductStatus(productId, isActive);
  }
}

