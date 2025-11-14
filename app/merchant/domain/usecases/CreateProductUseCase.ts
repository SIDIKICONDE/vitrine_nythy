/**
 * Use Case: CreateProductUseCase
 * Créer un produit anti-gaspillage
 */

import { MerchantProduct } from '../entities/MerchantProduct';
import { ProductRepository } from '../repositories/ProductRepository';
import { MerchantNotFoundException } from '../exceptions/MerchantExceptions';
import { MerchantRepository } from '../repositories/MerchantRepository';

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly merchantRepository: MerchantRepository
  ) {}

  async execute(product: MerchantProduct): Promise<void> {
    // Vérifier que le commerçant existe
    const merchant = await this.merchantRepository.getMerchantById(product.merchantId);
    if (!merchant) {
      throw new MerchantNotFoundException(`Commerçant introuvable: ${product.merchantId}`);
    }

    // Créer le produit anti-gaspillage
    await this.productRepository.createMerchantProduct(product);
  }
}

