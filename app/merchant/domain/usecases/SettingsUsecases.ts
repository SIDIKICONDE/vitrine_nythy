/**
 * SettingsUsecases - Cas d'usage pour les paramètres
 * Fichier groupé contenant tous les use cases liés aux paramètres des commerçants
 */

import { MerchantRepository } from '../repositories/MerchantRepository';

export interface MerchantSettings {
  merchantId: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  businessHours?: Record<string, { open: string; close: string; closed?: boolean }>;
  deliveryOptions?: string[];
  paymentMethods?: string[];
  autoAcceptOrders?: boolean;
  language?: string;
}

/**
 * GetMerchantSettingsUseCase - Obtenir les paramètres d'un commerçant
 */
export class GetMerchantSettingsUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string): Promise<MerchantSettings> {
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    return await this.merchantRepository.getMerchantSettings(merchantId);
  }
}

/**
 * UpdateMerchantSettingsUseCase - Mettre à jour les paramètres d'un commerçant
 */
export class UpdateMerchantSettingsUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(merchantId: string, settings: Partial<MerchantSettings>): Promise<void> {
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    // Vérifier que le commerçant existe
    const merchant = await this.merchantRepository.getMerchantById(merchantId);
    if (!merchant) {
      throw new Error(`Merchant with ID ${merchantId} not found`);
    }

    await this.merchantRepository.updateMerchantSettings(merchantId, settings);
  }
}

