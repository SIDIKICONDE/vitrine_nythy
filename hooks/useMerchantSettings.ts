/**
 * Hook: useMerchantSettings
 * Gestion des paramètres d'un commerçant avec architecture DDD
 * 
 * ✅ ARCHITECTURE DDD
 * - Utilise les Use Cases du domaine
 * - Séparation présentation/domaine
 * - État UI découplé du domaine
 */

import { useCallback, useEffect, useState } from 'react';
import { MerchantRepository } from '../app/merchant/domain/repositories/MerchantRepository';
import { StorageService } from '../app/merchant/domain/services/StorageService';
import { UpdateMerchantUseCase } from '../app/merchant/domain/usecases/UpdateMerchantUseCase';
import { UploadImageUseCase } from '../app/merchant/domain/usecases/UploadImageUseCase';
import { Merchant } from '../app/merchant/domain/entities/Merchant';
import { MerchantUpdateData } from '../types/merchant';

// ========================================
// TYPES
// ========================================

export interface MerchantSettingsFormData {
  // Informations commerciales
  businessName: string;
  legalName: string; // Synchronisé automatiquement avec businessName
  siret: string;
  merchantType: string;
  description: string;

  // Contact
  email: string;
  phone: string;
  websiteUrl: string;

  // Adresse
  address: string;
  city: string;
  postalCode: string;

  // Images
  logoUrl: string;
  bannerUrl: string;

  // Paiement
  iban: string;
  bic: string;
  paymentPreference: 'weekly' | 'biweekly' | 'manual';

  // Settings
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  privacy: {
    showPhone: boolean;
    showEmail: boolean;
    showAddress: boolean;
  };
  preferences: {
    language: string;
    currency: string;
    timezone: string;
  };

  // UI uniquement (non persisté dans le domaine)
  messageEnabled: boolean;
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  isActive: boolean;

  // Statistiques (read-only)
  followersCount: number;
  averageRating: number;
  totalReviews: number;
  savedItemsCount: number;
  co2Saved: number;
  totalOrders: number;
}

export interface UseMerchantSettingsResult {
  // État
  settings: MerchantSettingsFormData | null;
  loading: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;

  // Actions
  updateSettings: (updates: Partial<MerchantSettingsFormData>) => void;
  saveSettings: () => Promise<void>;
  uploadLogo: (file: File) => Promise<string>;
  uploadBanner: (file: File) => Promise<string>;
  resetError: () => void;
}

// ========================================
// HOOK
// ========================================

export function useMerchantSettings(
  merchantId: string,
  merchantRepository: MerchantRepository,
  storageService: StorageService
): UseMerchantSettingsResult {
  // === État local ===
  const [settings, setSettings] = useState<MerchantSettingsFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // === Use Cases ===
  const updateMerchantUseCase = new UpdateMerchantUseCase(merchantRepository);
  const uploadImageUseCase = new UploadImageUseCase(storageService);

  // === Chargement initial ===
  useEffect(() => {
    loadMerchantSettings();
  }, [merchantId]);

  /**
   * Charge les paramètres du commerçant depuis le repository
   */
  const loadMerchantSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const merchant = await merchantRepository.getMerchantById(merchantId);

      if (!merchant) {
        throw new Error('Commerçant introuvable');
      }

      // Transformation du modèle de domaine vers le modèle de présentation
      setSettings(mapMerchantToFormData(merchant));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      console.error('❌ Erreur chargement paramètres:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Met à jour les paramètres localement (UI)
   */
  const updateSettings = useCallback((updates: Partial<MerchantSettingsFormData>) => {
    setSettings(prev => prev ? { ...prev, ...updates } : null);
    setSaved(false); // Reset saved state on change
  }, []);

  /**
   * Sauvegarde les paramètres via le Use Case
   */
  const saveSettings = useCallback(async () => {
    if (!settings) return;

    try {
      setSaving(true);
      setError(null);

      // Transformation du modèle de présentation vers le modèle de domaine
      const updateData: MerchantUpdateData = mapFormDataToUpdateData(settings);

      // Exécution du Use Case (avec validation domaine)
      await updateMerchantUseCase.execute(merchantId, updateData);

      setSaved(true);

      // Reset saved state après 3 secondes
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
      console.error('❌ Erreur sauvegarde paramètres:', err);
      throw err; // Re-throw pour permettre la gestion dans le composant
    } finally {
      setSaving(false);
    }
  }, [settings, merchantId, updateMerchantUseCase]);

  /**
   * Upload du logo
   */
  const uploadLogo = useCallback(async (file: File): Promise<string> => {
    try {
      const result = await uploadImageUseCase.execute({
        merchantId,
        file,
        imageType: 'logo',
      });

      // Mettre à jour l'état local
      updateSettings({ logoUrl: result.url });

      // Sauvegarder automatiquement dans Firestore
      // ⚠️ Logo dans logoUrl + imageUrls[0] (Flutter utilise imageUrls.first pour le logo)
      const updateData: MerchantUpdateData = {
        logoUrl: result.url,
        logo_url: result.url, // Alias pour compatibilité
        imageUrls: [result.url], // Flutter lit imageUrls.first pour le logo
      };
      await updateMerchantUseCase.execute(merchantId, updateData);

      console.log('✅ Logo sauvegardé dans Firestore (logoUrl + imageUrls):', result.url);

      return result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload du logo');
      throw err;
    }
  }, [merchantId, uploadImageUseCase, updateSettings, updateMerchantUseCase]);

  /**
   * Upload de la bannière
   */
  const uploadBanner = useCallback(async (file: File): Promise<string> => {
    try {
      const result = await uploadImageUseCase.execute({
        merchantId,
        file,
        imageType: 'banner',
      });

      // Mettre à jour l'état local
      updateSettings({ bannerUrl: result.url });

      // Sauvegarder automatiquement dans Firestore
      // Banner uniquement dans bannerUrl (imageUrls est réservé pour le logo)
      const updateData: MerchantUpdateData = {
        bannerUrl: result.url,
        banner_url: result.url, // Alias pour compatibilité
      };
      await updateMerchantUseCase.execute(merchantId, updateData);

      console.log('✅ Bannière sauvegardée dans Firestore:', result.url);

      return result.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload de la bannière');
      throw err;
    }
  }, [merchantId, uploadImageUseCase, updateSettings, updateMerchantUseCase]);

  /**
   * Reset l'erreur
   */
  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    settings,
    loading,
    saving,
    saved,
    error,
    updateSettings,
    saveSettings,
    uploadLogo,
    uploadBanner,
    resetError,
  };
}

// ========================================
// MAPPERS (Présentation <-> Domaine)
// ========================================

/**
 * Transforme l'agrégat Merchant (domaine) en FormData (présentation)
 */
function mapMerchantToFormData(merchant: Merchant): MerchantSettingsFormData {
  const merchantData = merchant.toJSON();
  
  return {
    // Informations commerciales
    businessName: merchantData.name,
    legalName: merchantData.name,
    siret: merchantData.siret || '',
    merchantType: merchantData.type,
    description: merchantData.description || '',

    // Contact
    email: merchantData.email || '',
    phone: merchantData.phone || '',
    websiteUrl: merchantData.websiteUrl || '',

    // Adresse
    address: merchantData.addressLine1 || '',
    city: merchantData.city || '',
    postalCode: '',

    // Images
    logoUrl: merchantData.imageUrls?.[0] || '',
    bannerUrl: merchantData.bannerUrl || '',

    // Paiement
    iban: merchantData.iban || '',
    bic: merchantData.bic || '',
    paymentPreference: (merchantData.paymentPreference as 'weekly' | 'biweekly' | 'manual') || 'weekly',

    // Settings (valeurs par défaut)
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
    privacy: {
      showPhone: true,
      showEmail: true,
      showAddress: true,
    },
    preferences: {
      language: 'fr',
      currency: 'EUR',
      timezone: 'Europe/Paris',
    },

    // UI uniquement
    messageEnabled: merchantData.messageEnabled !== false,
    twoFactorEnabled: false,
    sessionTimeout: 30,
    isActive: merchantData.isActive,

    // Statistiques (read-only)
    followersCount: merchantData.stats?.followersCount || 0,
    averageRating: merchantData.stats?.averageRating || 0,
    totalReviews: merchantData.stats?.totalReviews || 0,
    savedItemsCount: merchantData.stats?.savedItemsCount || 0,
    co2Saved: merchantData.stats?.co2Saved || 0,
    totalOrders: merchantData.stats?.totalOrders || 0,
  };
}

/**
 * Transforme FormData (présentation) en UpdateData (domaine)
 */
function mapFormDataToUpdateData(formData: MerchantSettingsFormData): MerchantUpdateData {
  return {
    businessName: formData.businessName,
    legalName: formData.businessName, // Synchronisé automatiquement avec businessName
    siret: formData.siret,
    merchantType: formData.merchantType as any,
    description: formData.description,

    contactInfo: {
      email: formData.email,
      phone: formData.phone,
      website: formData.websiteUrl,
    },

    // Adresse (devrait être géocodée)
    // TODO: Utiliser GeocodeMerchantAddressUseCase
    address: {
      street: formData.address,
      city: formData.city,
      postalCode: formData.postalCode,
      countryCode: 'FR', // ISO 3166-1 alpha-2
    },

    logoUrl: formData.logoUrl,
    bannerUrl: formData.bannerUrl,

    // Paiement (extensions)
    iban: formData.iban,
    bic: formData.bic,
    paymentPreference: formData.paymentPreference,

    settings: {
      notifications: formData.notifications,
      privacy: formData.privacy,
      preferences: formData.preferences,
    },
  };
}

