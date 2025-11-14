/**
 * SuspendMerchantUseCase - Suspendre un commerçant
 */

import { SuspensionReason } from '../enums/SuspensionReason';
import { SuspensionType } from '../enums/SuspensionType';
import { MerchantRepository } from '../repositories/MerchantRepository';

export interface SuspensionData {
  merchantId: string;
  type: SuspensionType;
  reason: SuspensionReason;
  suspendedBy: string; // Admin ID
  notes?: string;
  expirationDate?: Date; // Required for temporary suspension
}

export class SuspendMerchantUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(data: SuspensionData): Promise<void> {
    if (!data.merchantId || data.merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }
    if (!data.suspendedBy || data.suspendedBy.trim() === '') {
      throw new Error('Suspended by (admin ID) is required');
    }

    // Vérifier que le commerçant existe
    const merchant = await this.merchantRepository.getMerchantById(data.merchantId);
    if (!merchant) {
      throw new Error(`Merchant with ID ${data.merchantId} not found`);
    }

    // Validation spécifique pour suspension temporaire
    if (data.type === SuspensionType.TEMPORARY && !data.expirationDate) {
      throw new Error('Expiration date is required for temporary suspension');
    }

    const reason = `${data.reason}${data.notes ? ` - ${data.notes}` : ''}`;
    await this.merchantRepository.suspendMerchant(data.merchantId, reason);
  }
}

