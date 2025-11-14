/**
 * CompleteMerchantRegistrationUseCase - Compléter l'inscription d'un commerçant
 */

import { MerchantRegistration } from '../entities/MerchantRegistration';
import { MerchantRepository } from '../repositories/MerchantRepository';

export class CompleteMerchantRegistrationUseCase {
  constructor(private readonly merchantRepository: MerchantRepository) {}

  async execute(registration: MerchantRegistration): Promise<string> {
    // La validation est déjà faite dans MerchantRegistrationEntity
    
    // Créer le commerçant via le repository
    const merchantId = await this.merchantRepository.registerMerchant(registration);

    return merchantId;
  }
}

