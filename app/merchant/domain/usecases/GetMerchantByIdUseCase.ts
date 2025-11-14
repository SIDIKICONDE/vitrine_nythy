/**
 * Use Case: GetMerchantByIdUseCase
 * Récupérer un commerçant par son ID
 */

import { Merchant } from '../entities/Merchant';
import { MerchantRepository } from '../repositories/MerchantRepository';
import { MerchantNotFoundException } from '../exceptions/MerchantExceptions';

export class GetMerchantByIdUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string): Promise<Merchant> {
    const merchant = await this.merchantRepository.getMerchantById(merchantId);

    if (!merchant) {
      throw new MerchantNotFoundException(`Commerçant introuvable: ${merchantId}`);
    }

    return merchant;
  }
}

