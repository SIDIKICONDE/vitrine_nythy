/**
 * CompleteMerchantOnboardingUseCase - Compléter l'onboarding d'un commerçant
 */

import { MerchantRepository } from '../repositories/MerchantRepository';

export interface OnboardingData {
  merchantId: string;
  bankAccountDetails?: string;
  taxInformation?: string;
  businessHours?: Record<string, { open: string; close: string }>;
  deliveryOptions?: string[];
  paymentMethods?: string[];
}

export class CompleteMerchantOnboardingUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(data: OnboardingData): Promise<void> {
    if (!data.merchantId || data.merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    // Vérifier que le commerçant existe
    const merchant = await this.merchantRepository.getMerchantById(data.merchantId);
    if (!merchant) {
      throw new Error(`Merchant with ID ${data.merchantId} not found`);
    }

    await this.merchantRepository.completeOnboarding(data.merchantId);
  }
}

