/**
 * UtilityUsecases - Cas d'usage utilitaires
 * Fichier groupé contenant des use cases utilitaires divers
 */

import { MerchantRepository } from '../repositories/MerchantRepository';

/**
 * CheckMerchantExistsUseCase - Vérifier si un commerçant existe
 */
export class CheckMerchantExistsUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string): Promise<boolean> {
    if (!merchantId || merchantId.trim() === '') {
      return false;
    }

    const merchant = await this.merchantRepository.getMerchantById(merchantId);
    return merchant !== null;
  }
}

/**
 * GetMerchantOwnerUseCase - Obtenir l'ID du propriétaire d'un commerçant
 */
export class GetMerchantOwnerUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string): Promise<string | null> {
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    const merchant = await this.merchantRepository.getMerchantById(merchantId);
    return merchant?.ownerId || null;
  }
}

/**
 * IsMerchantActiveUseCase - Vérifier si un commerçant est actif
 */
export class IsMerchantActiveUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string): Promise<boolean> {
    if (!merchantId || merchantId.trim() === '') {
      return false;
    }

    const merchant = await this.merchantRepository.getMerchantById(merchantId);
    return merchant?.isActive ?? false;
  }
}

/**
 * IsMerchantVerifiedUseCase - Vérifier si un commerçant est vérifié
 */
export class IsMerchantVerifiedUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string): Promise<boolean> {
    if (!merchantId || merchantId.trim() === '') {
      return false;
    }

    const merchant = await this.merchantRepository.getMerchantById(merchantId);
    return merchant?.isVerified ?? false;
  }
}

