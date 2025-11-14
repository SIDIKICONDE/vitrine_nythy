/**
 * VerifyMerchantUseCase - Vérifier un commerçant
 */

import { VerificationStatus } from '../enums/VerificationStatus';
import { MerchantRepository } from '../repositories/MerchantRepository';

export interface VerificationData {
  merchantId: string;
  status: VerificationStatus;
  verifiedBy: string; // Admin ID
  notes?: string;
  documentsVerified?: string[]; // IDs des documents vérifiés
}

export class VerifyMerchantUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(data: VerificationData): Promise<void> {
    if (!data.merchantId || data.merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }
    if (!data.verifiedBy || data.verifiedBy.trim() === '') {
      throw new Error('Verified by (admin ID) is required');
    }

    // Vérifier que le commerçant existe
    const merchant = await this.merchantRepository.getMerchantById(data.merchantId);
    if (!merchant) {
      throw new Error(`Merchant with ID ${data.merchantId} not found`);
    }

    await this.merchantRepository.verifyMerchant(data.merchantId);
  }
}

