/**
 * Use Case: UpdateMerchantUseCase
 * Mettre à jour les informations d'un commerçant
 * 
 * ✅ ARCHITECTURE DDD
 * - Validation des Value Objects
 * - Règles métier du domaine
 * - Agrégat Merchant
 */

import { Merchant } from '../entities/Merchant';
import { MerchantUpdateData } from '../repositories/MerchantRepository';
import { MerchantNotFoundException, ValidationError } from '../exceptions/MerchantExceptions';
import { MerchantRepository } from '../repositories/MerchantRepository';
import { validateBic, validateIban, validateSiret } from '../validators/MerchantValidators';

export class UpdateMerchantUseCase {
  constructor(
    private readonly merchantRepository: MerchantRepository
  ) { }

  /**
   * Exécute la mise à jour du commerçant
   * @param merchantId ID du commerçant
   * @param updateData Données à mettre à jour
   * @throws MerchantNotFoundException Si le commerçant n'existe pas
   * @throws ValidationError Si les données sont invalides
   */
  async execute(
    merchantId: string,
    updateData: MerchantUpdateData
  ): Promise<Merchant> {
    // === 1. VALIDATION DES INPUTS ===
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    // === 2. VÉRIFIER QUE LE COMMERÇANT EXISTE ===
    const existingMerchant = await this.merchantRepository.getMerchantById(merchantId);
    if (!existingMerchant) {
      throw new MerchantNotFoundException(
        `Commerçant introuvable: ${merchantId}`
      );
    }

    // === 3. VALIDATION DES VALUE OBJECTS ===
    this.validateBusinessData(updateData);

    // === 4. APPLIQUER LES RÈGLES MÉTIER ===
    const validatedData = this.applyBusinessRules(updateData);

    // === 5. MISE À JOUR DANS LE REPOSITORY ===
    const updatedMerchant = await this.merchantRepository.updateMerchant(
      merchantId,
      validatedData
    );

    return updatedMerchant;
  }

  /**
   * Validation des données métier (Value Objects)
   */
  private validateBusinessData(data: MerchantUpdateData): void {
    // Validation SIRET (si présent)
    if (data.siret !== undefined && data.siret !== '') {
      const cleanedSiret = data.siret.replace(/\s/g, '');

      // Vérifier le format (14 chiffres)
      if (!/^\d{14}$/.test(cleanedSiret)) {
        throw new ValidationError(
          '❌ SIRET invalide : le numéro SIRET doit contenir exactement 14 chiffres. ' +
          `Vous avez saisi ${cleanedSiret.length} caractères.`
        );
      }

      // Vérifier la validité (algorithme de Luhn)
      if (!validateSiret(data.siret)) {
        throw new ValidationError(
          '❌ SIRET invalide : le numéro SIRET saisi n\'est pas valide selon l\'algorithme de contrôle. ' +
          'Veuillez vérifier les chiffres et réessayer.'
        );
      }
    }

    // Validation IBAN (si présent)
    if (data.iban !== undefined && data.iban !== '') {
      if (!validateIban(data.iban)) {
        throw new ValidationError(
          '❌ IBAN invalide : le format de l\'IBAN n\'est pas correct. ' +
          'Un IBAN français doit contenir 27 caractères (ex: FR76 1234 5678 9012 3456 7890 123).'
        );
      }
    }

    // Validation BIC (si présent)
    if (data.bic !== undefined && data.bic !== '') {
      if (!validateBic(data.bic)) {
        throw new ValidationError(
          '❌ BIC/SWIFT invalide : le code BIC doit contenir 8 ou 11 caractères (ex: BNPAFRPP ou BNPAFRPP123).'
        );
      }
    }

    // Validation email (si présent et non vide)
    if (data.email && data.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new ValidationError(
          '❌ Email invalide : veuillez saisir une adresse email valide (ex: contact@exemple.fr).'
        );
      }
    }

    // Validation téléphone (si présent et non vide)
    if (data.phone && data.phone.trim() !== '') {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/; // Format E.164
      if (!phoneRegex.test(data.phone.replace(/\s/g, ''))) {
        throw new ValidationError(
          '❌ Téléphone invalide : veuillez saisir un numéro au format international (ex: +33123456789 ou +33 1 23 45 67 89).'
        );
      }
    }

    // Validation URL du site web (si présent et non vide)
    if (data.websiteUrl && data.websiteUrl.trim() !== '') {
      try {
        const website = data.websiteUrl.trim();
        // Ajouter https:// si aucun protocole n'est présent
        const urlToTest = website.startsWith('http://') || website.startsWith('https://')
          ? website
          : `https://${website}`;
        new URL(urlToTest);
      } catch {
        throw new ValidationError(
          '❌ URL du site web invalide : veuillez saisir une URL valide (ex: https://exemple.fr ou exemple.fr).'
        );
      }
    }
  }

  /**
   * Application des règles métier du domaine
   */
  private applyBusinessRules(
    updateData: MerchantUpdateData
  ): MerchantUpdateData {
    const validatedData = { ...updateData };

    // Règle: Le nom ne peut pas être vide
    if (validatedData.name !== undefined) {
      if (validatedData.name.trim() === '') {
        throw new Error('Le nom du commerce ne peut pas être vide');
      }
    }

    // Règle: Mettre à jour le timestamp
    validatedData.updatedAt = new Date();

    return validatedData;
  }
}
