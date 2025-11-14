/**
 * GetProductsUseCase - Obtenir tous les produits d'un marchand
 */

import { Product } from '../entities/Product';
import { ProductRepository } from '../repositories/ProductRepository';

export class GetProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(merchantId: string, onlyActive: boolean = true): Promise<Product[]> {
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    const products = await this.productRepository.getProducts(merchantId);

    if (onlyActive) {
      return products.filter(p => p.isActive);
    }

    return products;
  }
}

