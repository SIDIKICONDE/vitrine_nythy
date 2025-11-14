/**
 * GetMerchantsByCategoryUseCase - Obtenir les commerçants par catégorie
 */

import { Merchant } from '../entities/Merchant';
import { MerchantRepository } from '../repositories/MerchantRepository';

export class GetMerchantsByCategoryUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(categoryId: string, limit: number = 20, offset: number = 0): Promise<Merchant[]> {
    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required');
    }

    const merchants = await this.merchantRepository.getMerchantsByCategory(categoryId);
    
    // Appliquer pagination et limite
    return merchants.slice(offset, offset + limit);
  }
}

