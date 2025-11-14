/**
 * SearchProductsUseCase - Rechercher des produits anti-gaspillage
 */

import { MerchantProduct } from '../entities/MerchantProduct';
import { ProductFilters } from '../filters/ProductFilters';
import { ProductRepository } from '../repositories/ProductRepository';

export class SearchProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(filters: ProductFilters): Promise<MerchantProduct[]> {
    return await this.productRepository.searchProducts(filters);
  }
}

