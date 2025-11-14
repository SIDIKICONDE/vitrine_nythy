/**
 * Page des paramètres du marchand
 * 
 * ✅ ARCHITECTURE DDD COMPLÈTE
 * 
 * Cette page suit les principes Domain-Driven Design:
 * 
 * 1. SÉPARATION DES COUCHES
 *    - Présentation (ce fichier): UI et gestion des événements
 *    - Domaine: Use Cases, Entities, Value Objects (marchand/domain/)
 *    - Infrastructure: Repositories, Services (marchand/infrastructure/)
 * 
 * 2. USE CASES UTILISÉS
 *    - UpdateMerchantUseCase: Mise à jour des paramètres avec validation
 *    - UploadImageUseCase: Upload des images (logo, bannière)
 * 
 * 3. ABSTRACTIONS
 *    - Hook useMerchantSettings: Encapsule la logique métier
 *    - Mappers: Transformation Domaine <-> Présentation
 *    - Validators: Validation des Value Objects (SIRET, IBAN, etc.)
 * 
 * 4. ALIGNEMENT TYPES
 *    - types/merchant.ts: Types du domaine (Merchant, MerchantSettings)
 *    - types/merchant-enums.ts: Enums (MerchantType, MerchantStatus)
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import { useMerchantSettings } from '@/hooks/useMerchantSettings';
import { createAuthHeaders } from '@/lib/csrf-client';
import { MerchantType } from '@/types/merchant-enums';
import { useEffect, useState } from 'react';
import TwoFactorSetup from './components/TwoFactorSetup';

// TODO: Injecter les dépendances (Repository, StorageService)
// Pour l'instant, on utilise des mocks pour le développement

/**
 * PaymentPreference - Fréquences de versement
 * TODO: Déplacer dans types/ pour centraliser
 */
type PaymentPreference = 'weekly' | 'biweekly' | 'manual';

// Imports pour les vraies implémentations API
import apiMerchantRepository from '@/app/merchant/infrastructure/api/ApiMerchantRepository';
import apiStorageService from '@/app/merchant/infrastructure/api/ApiStorageService';

export default function SettingsPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantData, setMerchantData] = useState<{ name: string; email: string; image: string | null } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  // Charger le merchantId et le statut 2FA au démarrage
  useEffect(() => {
    const loadMerchantData = async () => {
      try {
        setInitialLoading(true);
        setInitialError(null);

        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          throw new Error(merchantResult.message || 'Commerce non trouvé');
        }

        const merchant = merchantResult.merchant;
        setMerchantId(merchant.id);

        // Extraire les données pour le header
        setMerchantData({
          name: merchant.business_name || merchant.name || 'Commerce',
          email: merchant.email || merchant.contact_email || '',
          image: merchant.logo || merchant.logo_url || null,
        });

        // Charger le statut 2FA réel depuis Firestore
        try {
          const headers = await createAuthHeaders({});
          const twoFAResponse = await fetch('/api/merchant/2fa/status', { headers });
          if (twoFAResponse.ok) {
            const twoFAResult = await twoFAResponse.json();
            if (twoFAResult.success) {
              setReal2FAStatus({
                enabled: twoFAResult.enabled,
                activatedAt: twoFAResult.activatedAt,
                recoveryCodesCount: twoFAResult.recoveryCodesCount ?? 0,
              });
              // Synchroniser avec le hook useMerchantSettings si disponible
              if (settings && twoFAResult.enabled !== settings.twoFactorEnabled) {
                updateSettings({ twoFactorEnabled: twoFAResult.enabled });
              }
            }
          }
        } catch (err) {
          console.warn('⚠️ Erreur chargement statut 2FA:', err);
          // Ne pas bloquer l'affichage si le 2FA échoue à charger
        }
      } catch (err) {
        console.error('Erreur chargement marchand:', err);
        setInitialError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setInitialLoading(false);
      }
    };

    loadMerchantData();
  }, []);

  // === Injection des dépendances (DDD) avec vraies APIs ===
  const merchantRepository = apiMerchantRepository;
  const storageService = apiStorageService;

  // === Hook DDD: useMerchantSettings ===
  const {
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
  } = useMerchantSettings(merchantId || 'temp', merchantRepository, storageService);

  // === État UI (non-domaine) ===
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'paiements' | 'securite'>('general');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // États pour le 2FA
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [show2FADisable, setShow2FADisable] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disable2FACode, setDisable2FACode] = useState('');
  const [disable2FAError, setDisable2FAError] = useState('');
  const [disable2FALoading, setDisable2FALoading] = useState(false);
  const [real2FAStatus, setReal2FAStatus] = useState<{ enabled: boolean; activatedAt: string | null; recoveryCodesCount: number } | null>(null);

  // Nettoyer les URLs d'aperçu pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
    };
  }, [logoPreview, bannerPreview]);

  // Scroller automatiquement vers le message d'erreur quand il apparaît
  useEffect(() => {
    if (error) {
      // Attendre un peu pour que le DOM soit mis à jour
      setTimeout(() => {
        const errorElement = document.querySelector('[data-error-message]');
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [error]);

  // === Handlers ===

  /**
   * Sauvegarde via le Use Case (DDD)
   */
  const handleSave = async () => {
    try {
      await saveSettings();
      console.log('✅ [DDD] Paramètres sauvegardés via UpdateMerchantUseCase');
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', err);
    }
  };

  /**
   * Upload du logo via le Use Case
   */
  const handleLogoUpload = async (file: File) => {
    try {
      const url = await uploadLogo(file);
      console.log('✅ [DDD] Logo uploadé via UploadImageUseCase:', url);
      // L'erreur est déjà gérée dans le hook useMerchantSettings
    } catch (err) {
      console.error('❌ Erreur upload logo:', err);
      // Nettoyer la preview en cas d'erreur
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
        setLogoPreview(null);
      }
      // L'erreur est déjà stockée dans le hook via setError
    }
  };

  const formatTimestamp = (value?: string | null) => {
    if (!value) {
      return '—';
    }
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Upload de la bannière via le Use Case
   */
  const handleBannerUpload = async (file: File) => {
    try {
      const url = await uploadBanner(file);
      console.log('✅ [DDD] Bannière uploadée via UploadImageUseCase:', url);
      // L'erreur est déjà gérée dans le hook useMerchantSettings
    } catch (err) {
      console.error('❌ Erreur upload bannière:', err);
      // Nettoyer la preview en cas d'erreur
      if (bannerPreview) {
        URL.revokeObjectURL(bannerPreview);
        setBannerPreview(null);
      }
      // L'erreur est déjà stockée dans le hook via setError
    }
  };

  /**
   * Handler pour l'activation du 2FA
   */
  const handle2FAComplete = async (codes: string[]) => {
    setRecoveryCodes(codes);
    setShow2FASetup(false);
    setShowRecoveryCodes(true);

    // Mettre à jour le statut 2FA localement
    updateSettings({ twoFactorEnabled: true });

    // Recharger le statut réel depuis Firestore
    try {
      const headers = await createAuthHeaders({});
      const response = await fetch('/api/merchant/2fa/status', { headers });
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setReal2FAStatus({
            enabled: result.enabled,
            activatedAt: result.activatedAt,
            recoveryCodesCount: result.recoveryCodesCount ?? 0,
          });
        }
      }
    } catch (err) {
      console.warn('⚠️ Erreur rechargement statut 2FA:', err);
    }
  };

  /**
   * Handler pour la désactivation du 2FA
   */
  const handle2FADisable = async () => {
    if (disable2FACode.length !== 6) {
      setDisable2FAError('Le code doit contenir 6 chiffres');
      return;
    }

    try {
      setDisable2FALoading(true);
      setDisable2FAError('');

      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch('/api/merchant/2fa/disable', {
        method: 'POST',
        headers,
        body: JSON.stringify({ code: disable2FACode }),
      });

      const data = await response.json();

      if (data.success) {
        setShow2FADisable(false);
        setDisable2FACode('');
        updateSettings({ twoFactorEnabled: false });
        setReal2FAStatus({ enabled: false, activatedAt: null, recoveryCodesCount: 0 });
        alert('✅ 2FA désactivé avec succès');
      } else {
        setDisable2FAError(data.message || 'Code invalide');
      }
    } catch (err) {
      console.error('❌ Erreur désactivation 2FA:', err);
      setDisable2FAError('Erreur lors de la désactivation');
    } finally {
      setDisable2FALoading(false);
    }
  };

  const handleRegenerateRecoveryCodes = async () => {
    try {
      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch('/api/merchant/2fa/regenerate-codes', {
        method: 'POST',
        headers,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Impossible de régénérer les codes');
      }

      setRecoveryCodes(data.recoveryCodes || []);
      setShowRecoveryCodes(true);
      setReal2FAStatus(prev => ({
        enabled: true,
        activatedAt: prev?.activatedAt || new Date().toISOString(),
        recoveryCodesCount: data.recoveryCodesCount ?? (prev?.recoveryCodesCount ?? 0),
      }));
    } catch (err) {
      console.error('❌ [2FA] Erreur régénération codes:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de la régénération des codes de récupération');
    }
  };

  // Utilisateur par défaut (fallback)
  const defaultUser = {
    name: 'Commerce',
    email: '',
    image: null,
  };

  const displayUser = merchantData || defaultUser;

  // === Chargement initial ===
  if (initialLoading || loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground-muted">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  // === Erreur ===
  if ((initialError || error) && !settings) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="liquid-glass p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">❌ Erreur</h2>
          <p className="text-foreground-muted mb-4">{initialError || error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // === Pas de merchantId ===
  if (!merchantId) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="liquid-glass p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">❌ Erreur</h2>
          <p className="text-foreground-muted mb-4">Commerce non trouvé</p>
        </div>
      </div>
    );
  }

  // === Pas de données ===
  if (!settings) {
    return null;
  }

  const tabs = [
    { id: 'general', label: '⚙️ Général', icon: '⚙️' },
    { id: 'notifications', label: '🔔 Notifications', icon: '🔔' },
    { id: 'paiements', label: '💳 Paiements', icon: '💳' },
    { id: 'securite', label: '🛡️ Sécurité', icon: '🛡️' },
  ] as const;

  return (
    <div className="min-h-screen bg-surface">
      <MerchantHeader user={displayUser} />
      <div className="flex">
        <MerchantSidebar />
        <main className="flex-1 p-8 lg:pb-8 pb-24">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Paramètres
              </h1>
              <p className="text-foreground-muted mt-2">
                Gérez les paramètres de votre commerce
              </p>
            </div>

            {/* Error Message Display */}
            {error && (
              <div
                data-error-message
                className="liquid-glass p-5 border-2 border-red-500 bg-red-50 shadow-lg animate-fade-in"
              >
                <div className="flex items-start gap-4">
                  <span className="text-3xl shrink-0">⚠️</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 mb-2 text-lg">Erreur lors de l'upload</h3>
                    <p className="text-red-800 font-medium leading-relaxed">{error}</p>
                    <p className="text-sm text-red-700 mt-2 opacity-90">
                      Veuillez vérifier les contraintes et réessayer.
                    </p>
                  </div>
                  <button
                    onClick={resetError}
                    className="text-red-600 hover:text-red-800 font-bold text-2xl leading-none shrink-0 p-1 hover:bg-red-100 rounded transition-colors"
                    aria-label="Fermer le message d'erreur"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* Success Message Display */}
            {saved && (
              <div className="liquid-glass p-4 border-2 border-green-500 bg-green-50">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-800 mb-1">Succès !</h3>
                    <p className="text-green-700 font-medium">Vos paramètres ont été enregistrés avec succès.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="liquid-glass p-2">
              <div className="flex gap-2 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors
                      ${activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-foreground-muted hover:bg-surface-hover'
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ==================== GÉNÉRAL ==================== */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <div className="liquid-glass p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    📝 Informations générales
                  </h2>

                  <div className="space-y-4">
                    {/* Nom commercial */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Nom du commerce <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={settings.businessName}
                        onChange={(e) => updateSettings({ businessName: e.target.value })}
                        placeholder="Boulangerie Bio"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                      <p className="text-xs text-foreground-muted mt-1">Le nom de votre commerce</p>
                    </div>

                    {/* SIRET */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        SIRET <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={settings.siret}
                        onChange={(e) => {
                          // Ne garder que les chiffres
                          const value = e.target.value.replace(/\D/g, '');
                          updateSettings({ siret: value });
                        }}
                        placeholder="12345678901234"
                        maxLength={14}
                        className={`w-full px-4 py-2 rounded-lg border bg-surface text-foreground focus:outline-none focus:ring-2 ${settings.siret && settings.siret.length !== 14
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-border focus:ring-primary'
                          }`}
                        required
                      />
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-foreground-muted">
                          Le SIRET doit contenir exactement 14 chiffres
                        </p>
                        {settings.siret && (
                          <p className={`text-xs font-medium ${settings.siret.length === 14 ? 'text-green-600' : 'text-red-600'
                            }`}>
                            {settings.siret.length}/14
                          </p>
                        )}
                      </div>
                      {settings.siret && settings.siret.length > 0 && settings.siret.length !== 14 && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          ⚠️ Veuillez entrer exactement 14 chiffres
                        </p>
                      )}
                    </div>

                    {/* Adresse */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Adresse <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={settings.address}
                        onChange={(e) => updateSettings({ address: e.target.value })}
                        placeholder="Ex: 2 Pl. de la Gare"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    {/* Code postal et Ville */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Code postal <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={settings.postalCode}
                          onChange={(e) => updateSettings({ postalCode: e.target.value })}
                          placeholder="67000"
                          className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Ville <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={settings.city}
                          onChange={(e) => updateSettings({ city: e.target.value })}
                          placeholder="Strasbourg"
                          className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>

                    {/* Type de commerce */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Type de commerce <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={settings.merchantType}
                        onChange={(e) => updateSettings({ merchantType: e.target.value as MerchantType })}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      >
                        <option value="restaurant">🍽️ Restaurant</option>
                        <option value="boulangerie">🥖 Boulangerie</option>
                        <option value="patisserie">🧁 Pâtisserie</option>
                        <option value="supermarche">🛒 Supermarché</option>
                        <option value="epicerie">🏪 Épicerie</option>
                        <option value="cafe">☕ Café</option>
                        <option value="traiteur">🍱 Traiteur</option>
                        <option value="primeur">🥬 Primeur</option>
                        <option value="boucherie">🥩 Boucherie</option>
                        <option value="charcuterie">🥓 Charcuterie</option>
                        <option value="poissonnerie">🐟 Poissonnerie</option>
                        <option value="fromagerie">🧀 Fromagerie</option>
                        <option value="chocolaterie">🍫 Chocolaterie</option>
                        <option value="glaciere">🍦 Glacerie</option>
                        <option value="pizzeria">🍕 Pizzeria</option>
                        <option value="fastFood">🍔 Fast Food</option>
                        <option value="biologique">🌱 Biologique</option>
                        <option value="vegan">🌿 Vegan</option>
                        <option value="autre">🏬 Autre</option>
                      </select>
                      <p className="text-xs text-foreground-muted mt-1">✅ 19 types alignés avec le backend</p>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email de contact <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={settings.email}
                        onChange={(e) => updateSettings({ email: e.target.value })}
                        placeholder="contact@exemple.fr"
                        className={`w-full px-4 py-2 rounded-lg border bg-surface text-foreground focus:outline-none focus:ring-2 ${settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email)
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-border focus:ring-primary'
                          }`}
                        required
                      />
                      {settings.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email) && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          ⚠️ Format d'email invalide
                        </p>
                      )}
                    </div>

                    {/* Téléphone */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Téléphone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={settings.phone}
                        onChange={(e) => updateSettings({ phone: e.target.value })}
                        placeholder="+33 1 23 45 67 89"
                        className={`w-full px-4 py-2 rounded-lg border bg-surface text-foreground focus:outline-none focus:ring-2 ${settings.phone && !/^\+?[1-9]\d{1,14}$/.test(settings.phone.replace(/\s/g, ''))
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-border focus:ring-primary'
                          }`}
                        required
                      />
                      <p className="text-xs text-foreground-muted mt-1">
                        Format international (ex: +33123456789 ou +33 1 23 45 67 89)
                      </p>
                      {settings.phone && !/^\+?[1-9]\d{1,14}$/.test(settings.phone.replace(/\s/g, '')) && (
                        <p className="text-xs text-red-600 mt-1 font-medium">
                          ⚠️ Format de téléphone invalide (utilisez le format international)
                        </p>
                      )}
                    </div>

                    {/* Site web */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Site web
                      </label>
                      <input
                        type="url"
                        value={settings.websiteUrl}
                        onChange={(e) => updateSettings({ websiteUrl: e.target.value })}
                        placeholder="https://votre-site.fr"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Description
                      </label>
                      <textarea
                        value={settings.description}
                        onChange={(e) => updateSettings({ description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Logo et Bannière */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Logo */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Logo
                        </label>
                        <div className="space-y-2">
                          {/* Aperçu */}
                          {(logoPreview || settings.logoUrl) && (
                            <div className="relative w-full h-32 bg-surface-hover rounded-lg overflow-hidden border border-border">
                              <img
                                src={logoPreview || settings.logoUrl}
                                alt="Logo du commerce"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              {logoPreview && (
                                <button
                                  onClick={() => {
                                    if (logoPreview) {
                                      URL.revokeObjectURL(logoPreview);
                                    }
                                    setLogoPreview(null);
                                    updateSettings({ logoUrl: '' });
                                  }}
                                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                  type="button"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          )}

                          {/* Input file */}
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Nettoyer l'ancienne URL d'aperçu
                                  if (logoPreview) {
                                    URL.revokeObjectURL(logoPreview);
                                  }
                                  // Créer un aperçu immédiat
                                  const previewUrl = URL.createObjectURL(file);
                                  setLogoPreview(previewUrl);
                                  // Upload via le Use Case (DDD)
                                  await handleLogoUpload(file);
                                }
                              }}
                              className="hidden"
                            />
                            <div className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-border bg-surface-hover hover:bg-surface-active cursor-pointer transition-colors text-center">
                              <span className="text-foreground font-medium">
                                📷 Choisir un logo
                              </span>
                              <p className="text-xs text-foreground-muted mt-1">
                                PNG, JPG, WebP ou SVG • Compression automatique en WebP
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Bannière */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Bannière
                        </label>
                        <div className="space-y-2">
                          {/* Aperçu */}
                          {(bannerPreview || settings.bannerUrl) && (
                            <div className="relative w-full h-32 bg-surface-hover rounded-lg overflow-hidden border border-border">
                              <img
                                src={bannerPreview || settings.bannerUrl}
                                alt="Bannière du commerce"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                              {bannerPreview && (
                                <button
                                  onClick={() => {
                                    if (bannerPreview) {
                                      URL.revokeObjectURL(bannerPreview);
                                    }
                                    setBannerPreview(null);
                                    updateSettings({ bannerUrl: '' });
                                  }}
                                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                                  type="button"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                          )}

                          {/* Input file */}
                          <label className="block">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  // Nettoyer l'ancienne URL d'aperçu
                                  if (bannerPreview) {
                                    URL.revokeObjectURL(bannerPreview);
                                  }
                                  // Créer un aperçu immédiat
                                  const previewUrl = URL.createObjectURL(file);
                                  setBannerPreview(previewUrl);
                                  // Upload via le Use Case (DDD)
                                  await handleBannerUpload(file);
                                }
                              }}
                              className="hidden"
                            />
                            <div className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-border bg-surface-hover hover:bg-surface-active cursor-pointer transition-colors text-center">
                              <span className="text-foreground font-medium">
                                📷 Choisir une bannière
                              </span>
                              <p className="text-xs text-foreground-muted mt-1">
                                PNG, JPG, WebP ou SVG • Compression automatique en WebP
                              </p>
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Langue et devise */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Langue
                        </label>
                        <input
                          type="text"
                          value="🇫🇷 Français"
                          disabled
                          className="w-full px-4 py-2 rounded-lg border border-border bg-surface-hover text-foreground-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-foreground-muted mt-1">Langue fixée en français uniquement</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Devise
                        </label>
                        <input
                          type="text"
                          value="€ EUR"
                          disabled
                          className="w-full px-4 py-2 rounded-lg border border-border bg-surface-hover text-foreground-muted cursor-not-allowed"
                        />
                        <p className="text-xs text-foreground-muted mt-1">Devise fixée en euros uniquement</p>
                      </div>
                    </div>

                    {/* Statut actif */}
                    <div className="pt-4 border-t border-border">
                      <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer">
                        <div>
                          <p className="font-medium text-foreground">Commerce actif</p>
                          <p className="text-sm text-foreground-muted">Votre commerce est visible sur la plateforme</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.isActive}
                          onChange={(e) => updateSettings({ isActive: e.target.checked })}
                          className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== NOTIFICATIONS ==================== */}
            {activeTab === 'notifications' && (
              <div className="space-y-4">
                {/* Canaux de notification */}
                <div className="liquid-glass p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    🔔 Préférences de notifications
                  </h2>
                  <p className="text-sm text-foreground-muted mb-6">
                    Choisissez comment vous souhaitez être notifié des événements importants
                  </p>

                  <div className="space-y-3">
                    {/* Email */}
                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📧</span>
                        <div>
                          <p className="font-medium text-foreground">Email</p>
                          <p className="text-sm text-foreground-muted">Recevoir des notifications par email</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.email}
                        onChange={(e) => updateSettings({
                          notifications: { ...settings.notifications, email: e.target.checked }
                        })}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>

                    {/* SMS */}
                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📱</span>
                        <div>
                          <p className="font-medium text-foreground">SMS</p>
                          <p className="text-sm text-foreground-muted">Recevoir des SMS pour les urgences</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.sms}
                        onChange={(e) => updateSettings({
                          notifications: { ...settings.notifications, sms: e.target.checked }
                        })}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>

                    {/* Push */}
                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🔔</span>
                        <div>
                          <p className="font-medium text-foreground">Push</p>
                          <p className="text-sm text-foreground-muted">Notifications push dans le navigateur</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.notifications.push}
                        onChange={(e) => updateSettings({
                          notifications: { ...settings.notifications, push: e.target.checked }
                        })}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* Types d'événements */}
                <div className="liquid-glass p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    📋 Événements à notifier
                  </h2>
                  <p className="text-sm text-foreground-muted mb-6">
                    Sélectionnez les événements pour lesquels vous souhaitez recevoir une notification
                  </p>

                  <div className="space-y-3">
                    {/* Nouvelles commandes */}
                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🛒</span>
                        <div>
                          <p className="font-medium text-foreground">Nouvelles commandes</p>
                          <p className="text-sm text-foreground-muted">Être notifié à chaque nouvelle commande</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>

                    {/* Nouveaux avis */}
                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⭐</span>
                        <div>
                          <p className="font-medium text-foreground">Nouveaux avis clients</p>
                          <p className="text-sm text-foreground-muted">Recevoir les avis et évaluations des clients</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>

                    {/* Stock faible */}
                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📦</span>
                        <div>
                          <p className="font-medium text-foreground">Stock faible</p>
                          <p className="text-sm text-foreground-muted">Alertes lorsqu'un produit est bientôt en rupture</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>

                    {/* Versements */}
                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">💰</span>
                        <div>
                          <p className="font-medium text-foreground">Versements</p>
                          <p className="text-sm text-foreground-muted">Confirmations de vos versements bancaires</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>

                    {/* Produits expirés */}
                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⏰</span>
                        <div>
                          <p className="font-medium text-foreground">Offres expirées</p>
                          <p className="text-sm text-foreground-muted">Produits dont la date limite est passée</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>

                    {/* Nouveaux followers */}
                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">👥</span>
                        <div>
                          <p className="font-medium text-foreground">Nouveaux abonnés</p>
                          <p className="text-sm text-foreground-muted">Être averti quand quelqu'un suit votre commerce</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={false}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>
                  </div>
                </div>

                {/* Résumés périodiques */}
                <div className="liquid-glass p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    📊 Rapports périodiques
                  </h2>
                  <p className="text-sm text-foreground-muted mb-6">
                    Recevez des résumés de votre activité par email
                  </p>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div>
                        <p className="font-medium text-foreground">Rapport quotidien</p>
                        <p className="text-sm text-foreground-muted">Résumé de vos ventes chaque jour</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div>
                        <p className="font-medium text-foreground">Rapport hebdomadaire</p>
                        <p className="text-sm text-foreground-muted">Résumé complet chaque semaine</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors">
                      <div>
                        <p className="font-medium text-foreground">Rapport mensuel</p>
                        <p className="text-sm text-foreground-muted">Statistiques détaillées chaque mois</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked={true}
                        className="w-5 h-5 text-primary focus:ring-primary border-border rounded"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== PAIEMENTS ==================== */}
            {activeTab === 'paiements' && (
              <div className="space-y-4">
                {/* Informations bancaires */}
                <div className="liquid-glass p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    🏦 Informations bancaires
                  </h2>

                  <div className="space-y-4">
                    {/* IBAN */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        IBAN
                      </label>
                      <input
                        type="text"
                        value={settings.iban}
                        onChange={(e) => {
                          // Formater l'IBAN (retirer les espaces pour la validation)
                          const value = e.target.value.toUpperCase();
                          updateSettings({ iban: value });
                        }}
                        placeholder="FR76 1234 5678 9012 3456 7890 123"
                        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                      />
                      <p className="text-xs text-foreground-muted mt-1">
                        Format IBAN (ex: FR76 1234 5678 9012 3456 7890 123)
                      </p>
                    </div>

                    {/* BIC */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        BIC/SWIFT
                      </label>
                      <input
                        type="text"
                        value={settings.bic}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase();
                          updateSettings({ bic: value });
                        }}
                        placeholder="BNPAFRPP"
                        maxLength={11}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
                      />
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-foreground-muted">
                          8 ou 11 caractères (ex: BNPAFRPP)
                        </p>
                        {settings.bic && (
                          <p className={`text-xs font-medium ${settings.bic.length === 8 || settings.bic.length === 11 ? 'text-green-600' : 'text-orange-600'
                            }`}>
                            {settings.bic.length} caractères
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Préférence de versement */}
                    <div className="pt-4 border-t border-border">
                      <label className="block text-sm font-medium text-foreground mb-3">
                        ⏱️ Fréquence de versement
                      </label>
                      <p className="text-sm text-foreground-muted mb-4">
                        Choisissez la fréquence à laquelle vous souhaitez recevoir vos paiements
                      </p>
                      <div className="space-y-3">
                        <label className="flex items-center p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors border-2 border-transparent hover:border-primary">
                          <input
                            type="radio"
                            name="paymentPreference"
                            value="weekly"
                            checked={settings.paymentPreference === 'weekly'}
                            onChange={(e) => updateSettings({ paymentPreference: e.target.value as PaymentPreference })}
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />²
                          <div className="ml-3">
                            <p className="font-medium text-foreground">Hebdomadaire</p>
                            <p className="text-sm text-foreground-muted">Versement chaque semaine</p>
                          </div>
                        </label>
                        <label className="flex items-center p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors border-2 border-transparent hover:border-primary">
                          <input
                            type="radio"
                            name="paymentPreference"
                            value="biweekly"
                            checked={settings.paymentPreference === 'biweekly'}
                            onChange={(e) => updateSettings({ paymentPreference: e.target.value as PaymentPreference })}
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />
                          <div className="ml-3">
                            <p className="font-medium text-foreground">Bi-hebdomadaire</p>
                            <p className="text-sm text-foreground-muted">Versement toutes les deux semaines</p>
                          </div>
                        </label>
                        <label className="flex items-center p-4 bg-surface-hover rounded-lg cursor-pointer hover:bg-surface-active transition-colors border-2 border-transparent hover:border-primary">
                          <input
                            type="radio"
                            name="paymentPreference"
                            value="manual"
                            checked={settings.paymentPreference === 'manual'}
                            onChange={(e) => updateSettings({ paymentPreference: e.target.value as PaymentPreference })}
                            className="w-4 h-4 text-primary focus:ring-primary"
                          />
                          <div className="ml-3">
                            <p className="font-medium text-foreground">Manuel</p>
                            <p className="text-sm text-foreground-muted">Demande de versement à votre initiative</p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statut Stripe */}
                <div className="liquid-glass p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    🔌 Intégration Stripe
                  </h2>

                  {settings.iban && settings.bic ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">✅</span>
                        <div>
                          <p className="font-bold text-green-800">Informations bancaires renseignées</p>
                          <p className="text-sm text-green-600">Vous pouvez recevoir des paiements</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <p className="font-bold text-yellow-800">Informations bancaires manquantes</p>
                          <p className="text-sm text-yellow-600">Renseignez votre IBAN et BIC pour recevoir des paiements</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==================== SÉCURITÉ ==================== */}
            {activeTab === 'securite' && (
              <div className="space-y-4">
                {/* Authentification à deux facteurs - Carte détaillée */}
                <div className="liquid-glass p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    🛡️ Authentification à deux facteurs (2FA)
                  </h2>

                  {/* Statut 2FA */}
                  <div className={`p-5 rounded-xl mb-6 ${settings.twoFactorEnabled
                    ? 'bg-green-50 border-2 border-green-200'
                    : 'bg-orange-50 border-2 border-orange-200'
                    }`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${settings.twoFactorEnabled ? 'bg-green-200' : 'bg-orange-200'
                        }`}>
                        {settings.twoFactorEnabled ? '🔒' : '🔓'}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold mb-1 ${settings.twoFactorEnabled ? 'text-green-900' : 'text-orange-900'
                          }`}>
                          {settings.twoFactorEnabled
                            ? '✅ Authentification 2FA activée'
                            : '⚠️ Authentification 2FA désactivée'
                          }
                        </h3>
                        <p className={`text-sm ${settings.twoFactorEnabled ? 'text-green-700' : 'text-orange-700'
                          }`}>
                          {settings.twoFactorEnabled
                            ? 'Votre compte est protégé par une double authentification'
                            : 'Activez le 2FA pour sécuriser votre compte marchand'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-foreground mb-3">
                      Qu'est-ce que l'authentification à deux facteurs ?
                    </h4>
                    <p className="text-sm text-foreground-muted mb-4">
                      Le 2FA ajoute une couche de sécurité supplémentaire à votre compte.
                      Après avoir saisi votre mot de passe, vous devrez entrer un code de vérification
                      temporaire généré par une application d'authentification.
                    </p>

                    {!settings.twoFactorEnabled && (
                      <div className="bg-surface-hover p-4 rounded-lg">
                        <h5 className="font-medium text-foreground mb-2">
                          📱 Pour activer le 2FA, vous aurez besoin de :
                        </h5>
                        <ul className="space-y-2 text-sm text-foreground-muted">
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">1.</span>
                            <span>Une application d'authentification (Google Authenticator, Microsoft Authenticator)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">2.</span>
                            <span>Scanner le code QR qui vous sera présenté</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-primary font-bold">3.</span>
                            <span>Entrer le code de vérification à 6 chiffres</span>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>

                  {settings.twoFactorEnabled && real2FAStatus && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 space-y-2">
                      <p className="text-sm text-blue-900">
                        <strong>Activé le :</strong>{' '}
                        {formatTimestamp(real2FAStatus.activatedAt)}
                      </p>
                      <p className="text-sm text-blue-900">
                        <strong>Codes de récupération :</strong> {real2FAStatus.recoveryCodesCount} restants
                      </p>
                      <button
                        onClick={handleRegenerateRecoveryCodes}
                        className="w-full py-2 px-3 text-sm font-semibold text-blue-700 bg-blue-100 rounded-lg border border-blue-200 hover:bg-blue-200 transition-colors"
                      >
                        🔄 Régénérer les codes de récupération
                      </button>
                    </div>
                  )}

                  {/* Bouton d'action */}
                  <button
                    onClick={() => {
                      if (settings.twoFactorEnabled) {
                        // Ouvrir le modal de désactivation
                        setShow2FADisable(true);
                      } else {
                        // Ouvrir le modal d'activation
                        setShow2FASetup(true);
                      }
                    }}
                    className={`w-full font-bold py-3 px-6 rounded-lg transition-colors shadow-lg ${settings.twoFactorEnabled
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-primary hover:bg-primary-dark text-white'
                      }`}
                  >
                    {settings.twoFactorEnabled
                      ? '❌ Désactiver l\'authentification 2FA'
                      : '🔐 Activer l\'authentification 2FA'
                    }
                  </button>
                </div>

                {/* Autres paramètres de sécurité */}
                <div className="liquid-glass p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    🔐 Autres paramètres de sécurité
                  </h2>

                  <div className="space-y-4">
                    {/* Timeout de session */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        ⏱️ Délai d'expiration de session
                      </label>
                      <select
                        value={settings.sessionTimeout}
                        onChange={(e) => updateSettings({ sessionTimeout: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="15">15 minutes</option>
                        <option value="30">30 minutes (recommandé)</option>
                        <option value="60">1 heure</option>
                        <option value="120">2 heures</option>
                        <option value="480">8 heures</option>
                      </select>
                      <p className="text-xs text-foreground-muted mt-1">
                        Durée d'inactivité avant déconnexion automatique
                      </p>
                    </div>

                    {/* Changer le mot de passe */}
                    <div className="pt-4 border-t border-border">
                      <button
                        onClick={() => alert('🔑 Changement de mot de passe\n\nCette fonctionnalité vous redirigera vers la page de modification de mot de passe.')}
                        className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-md"
                      >
                        🔑 Changer le mot de passe
                      </button>
                      <p className="text-xs text-foreground-muted mt-2 text-center">
                        Utilisez un mot de passe fort avec au moins 12 caractères
                      </p>
                    </div>

                    {/* Historique des connexions */}
                    <div className="pt-4 border-t border-border">
                      <h4 className="font-medium text-foreground mb-3">
                        📋 Activité récente du compte
                      </h4>
                      <div className="bg-surface-hover p-4 rounded-lg space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground-muted">💻 Dernière connexion</span>
                          <span className="font-medium text-foreground">Aujourd'hui à 14:32</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground-muted">📍 Adresse IP</span>
                          <span className="font-mono text-foreground">192.168.1.1</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground-muted">🌐 Navigateur</span>
                          <span className="text-foreground">Chrome 120</span>
                        </div>
                      </div>
                      <button
                        onClick={() => alert('📜 Affichage de l\'historique complet des connexions')}
                        className="w-full mt-3 bg-surface-hover hover:bg-surface-active text-foreground font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Voir l'historique complet
                      </button>
                    </div>
                  </div>
                </div>

                {/* Zone dangereuse */}
                <div className="liquid-glass p-6 border-2 border-red-200">
                  <h2 className="text-xl font-bold text-red-600 mb-4">
                    ⚠️ Zone dangereuse
                  </h2>
                  <p className="text-sm text-foreground-muted mb-4">
                    Ces actions sont irréversibles. Procédez avec prudence.
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        if (confirm('⚠️ Désactiver temporairement votre compte ?\n\nVotre commerce ne sera plus visible sur la plateforme jusqu\'à réactivation.')) {
                          updateSettings({ isActive: false });
                        }
                      }}
                      className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-3 px-4 rounded-lg transition-colors border-2 border-yellow-300"
                    >
                      🟡 Désactiver mon compte temporairement
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('🔴 ATTENTION ! Supprimer définitivement votre compte ?\n\nCette action est IRRÉVERSIBLE. Toutes vos données seront perdues.\n\nTapez "SUPPRIMER" pour confirmer.')) {
                          const confirmation = prompt('Tapez "SUPPRIMER" pour confirmer :');
                          if (confirmation === 'SUPPRIMER') {
                            alert('🚨 Suppression du compte...\n\nVotre compte et toutes vos données seront supprimés dans les prochaines 24h.\n\nVous recevrez un email de confirmation.');
                          } else {
                            alert('❌ Suppression annulée');
                          }
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg"
                    >
                      🔴 Supprimer définitivement mon compte
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bouton de sauvegarde fixe */}
            <div className="sticky bottom-8 lg:bottom-8 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`
                  px-6 py-3 rounded-lg font-bold shadow-lg transition-all
                  ${saved
                    ? 'bg-green-600 text-white'
                    : 'bg-primary hover:bg-primary-dark text-white'
                  }
                  ${saving ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {saving ? '💾 Enregistrement...' : saved ? '✅ Enregistré !' : '💾 Enregistrer les modifications'}
              </button>
            </div>

          </div>
        </main>
      </div>

      {/* ==================== MODALS 2FA ==================== */}

      {/* Modal : Activation 2FA */}
      {show2FASetup && merchantId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <TwoFactorSetup
              userId={merchantId}
              onComplete={handle2FAComplete}
              onCancel={() => setShow2FASetup(false)}
            />
          </div>
        </div>
      )}

      {/* Modal : Codes de récupération */}
      {showRecoveryCodes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2 text-foreground">
                  🔑 Codes de récupération
                </h3>
                <p className="text-sm text-foreground-muted">
                  Sauvegardez ces codes en lieu sûr. Vous pourrez les utiliser pour accéder à votre compte si vous perdez l&apos;accès à votre application d&apos;authentification.
                </p>
              </div>

              {/* Codes */}
              <div className="bg-surface-hover p-4 rounded-lg">
                <div className="space-y-2">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-xs text-foreground-muted w-4">{index + 1}.</span>
                      <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded border border-border">
                        {code}
                      </code>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avertissement */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>Important :</strong> Chaque code ne peut être utilisé qu&apos;une seule fois. Stockez-les dans un endroit sécurisé.
                </p>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const codesText = recoveryCodes.join('\n');
                    navigator.clipboard.writeText(codesText);
                    alert('📋 Codes copiés dans le presse-papier');
                  }}
                  className="flex-1 px-4 py-2 bg-surface-hover hover:bg-surface-active rounded-lg transition-colors text-foreground"
                >
                  📋 Copier
                </button>
                <button
                  onClick={() => {
                    setShowRecoveryCodes(false);
                    setRecoveryCodes([]);
                    alert('✅ 2FA activé avec succès !');
                  }}
                  className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
                >
                  J&apos;ai sauvegardé
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal : Désactivation 2FA */}
      {show2FADisable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold mb-2 text-foreground">
                  ⚠️ Désactiver le 2FA
                </h3>
                <p className="text-sm text-foreground-muted">
                  Pour désactiver l&apos;authentification à deux facteurs, entrez le code de vérification de votre application d&apos;authentification.
                </p>
              </div>

              {/* Input code */}
              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={disable2FACode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setDisable2FACode(value);
                    setDisable2FAError('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && disable2FACode.length === 6) {
                      handle2FADisable();
                    }
                  }}
                  placeholder="000000"
                  className="w-full px-4 py-3 text-center text-2xl font-mono rounded-lg border-2 border-border focus:border-primary focus:outline-none bg-white text-foreground"
                  autoFocus
                />
              </div>

              {/* Erreur */}
              {disable2FAError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">⚠️ {disable2FAError}</p>
                </div>
              )}

              {/* Avertissement */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ La désactivation du 2FA rendra votre compte moins sécurisé.
                </p>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShow2FADisable(false);
                    setDisable2FACode('');
                    setDisable2FAError('');
                  }}
                  className="flex-1 px-4 py-2 bg-surface-hover hover:bg-surface-active rounded-lg transition-colors text-foreground"
                >
                  Annuler
                </button>
                <button
                  onClick={handle2FADisable}
                  disabled={disable2FALoading || disable2FACode.length !== 6}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {disable2FALoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Désactivation...
                    </span>
                  ) : (
                    'Désactiver'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
