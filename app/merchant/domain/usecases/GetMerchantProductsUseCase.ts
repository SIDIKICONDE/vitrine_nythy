/**
 * GetMerchantProductsUseCase - Obtenir les produits anti-gaspillage d'un marchand
 */

import { MerchantProduct } from '../entities/MerchantProduct';
import { MerchantRepository } from '../repositories/MerchantRepository';

export class GetMerchantProductsUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string, onlyAvailable: boolean = true): Promise<MerchantProduct[]> {
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    return await this.merchantRepository.getMerchantProducts(merchantId, onlyAvailable);
  }
}

