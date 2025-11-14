/**
 * UpdateProductUseCase - Mettre à jour un produit
 */

import { Product } from '../entities/Product';
import { ProductRepository } from '../repositories/ProductRepository';

export class UpdateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(productId: string, updates: Partial<Product>): Promise<void> {
    // Validation
    if (!productId || productId.trim() === '') {
      throw new Error('Product ID is required');
    }

    // Vérifier que le produit existe
    const existingProduct = await this.productRepository.getProductById(productId);
    if (!existingProduct) {
      throw new Error(`Product with ID ${productId} not found`);
    }

    // Valider les mises à jour
    if (updates.price !== undefined && updates.price <= 0) {
      throw new Error('Product price must be positive');
    }
    if (updates.quantity !== undefined && updates.quantity < 0) {
      throw new Error('Product quantity cannot be negative');
    }

    // Créer le produit mis à jour
    const updatedProduct: Product = {
      ...existingProduct,
      ...updates,
      updatedAt: new Date(),
    };

    await this.productRepository.updateProduct(updatedProduct);
  }
}

