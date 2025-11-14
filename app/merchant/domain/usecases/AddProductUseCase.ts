/**
 * AddProductUseCase - Ajouter un produit
 */

import { Product } from '../entities/Product';
import { ProductRepository } from '../repositories/ProductRepository';

export class AddProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(product: Product): Promise<string> {
    // Validation
    if (!product.merchantId || product.merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }
    if (!product.name || product.name.trim() === '') {
      throw new Error('Product name is required');
    }
    if (product.price <= 0) {
      throw new Error('Product price must be positive');
    }
    if (product.quantity < 0) {
      throw new Error('Product quantity cannot be negative');
    }

    await this.productRepository.createProduct(product);
    return product.id;
  }
}

