/**
 * Page de profil du marchand - Vue complète
 * 
 * ✅ Connectée aux APIs Firebase
 * - Affiche TOUTES les informations du marchand
 * - Read-only (les modifications se font dans /settings)
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import { getMerchantTypeLabel } from '@/app/merchant/domain/enums/MerchantType';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MerchantProfilePage() {
  const [merchantData, setMerchantData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour charger les données du marchand
  const fetchMerchantData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer les données du marchand avec cache-busting
      const merchantResponse = await fetch('/api/merchant/me?t=' + Date.now());
      const merchantResult = await merchantResponse.json();

      if (!merchantResponse.ok || !merchantResult.success) {
        throw new Error(merchantResult.message || 'Commerce non trouvé');
      }

      const merchant = merchantResult.merchant;

      // 2. Extraire les données pour le header
      setMerchantData({
        name: merchant.business_name || merchant.name || 'Commerce',
        email: merchant.email || merchant.contact_email || '',
        image: merchant.logo || merchant.logo_url || null,
      });

      // 3. Normaliser les données du marchand pour l'affichage
      setSettings({
        // Informations de base
        businessName: merchant.business_name || merchant.name || '',
        legalName: merchant.legal_name || merchant.business_name || '',
        siret: merchant.siret || 'Non renseigné',
        isActive: merchant.is_active !== false,
        isVerified: merchant.is_verified || merchant.isVerified || false,
        status: merchant.status || 'pending',
        merchantType: merchant.merchantType || merchant.merchant_type || merchant.type || merchant.category || 'autre',
        description: merchant.description || '',

        // Images
        logoUrl: merchant.logo || merchant.logo_url || null,
        bannerUrl: merchant.banner || merchant.banner_url || null,

        // Contact
        email: merchant.email || merchant.contact_email || '',
        phone: merchant.phone || merchant.contact_phone || '',
        contactEmail: merchant.contact_email || merchant.email || '',
        contactPhone: merchant.contact_phone || merchant.phone || '',

        // Adresse (gérer objet ou string)
        address: typeof merchant.address === 'object' && merchant.address !== null
          ? merchant.address.street || merchant.address.addressLine1 || ''
          : merchant.address || '',
        city: typeof merchant.address === 'object' && merchant.address !== null
          ? merchant.address.city || ''
          : merchant.city || '',
        postalCode: typeof merchant.address === 'object' && merchant.address !== null
          ? merchant.address.postalCode || merchant.address.postal_code || ''
          : merchant.postal_code || merchant.postalCode || '',
        country: typeof merchant.address === 'object' && merchant.address !== null
          ? merchant.address.country || 'France'
          : merchant.country || 'France',
        latitude: merchant.latitude || merchant.location?.latitude || 0,
        longitude: merchant.longitude || merchant.location?.longitude || 0,

        // Statistiques
        followersCount: merchant.stats?.followersCount || merchant.followers_count || 0,
        averageRating: merchant.stats?.averageRating || merchant.average_rating || 0,
        totalReviews: merchant.stats?.totalReviews || merchant.total_reviews || 0,
        savedItemsCount: merchant.stats?.savedItemsCount || merchant.saved_items_count || 0,
        co2Saved: merchant.stats?.co2Saved || merchant.co2_saved || 0,
        totalOrders: merchant.stats?.totalOrders || merchant.total_orders || 0,
        totalRevenue: merchant.stats?.totalRevenue || merchant.total_revenue || 0,
        totalProducts: merchant.stats?.totalProducts || merchant.total_products || 0,

        // Horaires
        openingHours: merchant.opening_hours || {},

        // Informations complémentaires
        features: merchant.features || [],
        certifications: merchant.certifications || [],
        paymentMethods: merchant.payment_methods || [],
        deliveryOptions: merchant.delivery_options || [],

        // Réseaux sociaux
        websiteUrl: merchant.website || merchant.websiteUrl || '',
        website: merchant.website || merchant.websiteUrl || '',
        instagram: merchant.instagram || '',
        facebook: merchant.facebook || '',

        // Paramètres de confidentialité (par défaut: privé pour protéger les données)
        privacy: merchant.privacy || {
          showPhone: false,  // Téléphone privé par défaut
          showEmail: false,  // Email privé par défaut
          showAddress: false, // Adresse privée par défaut (sécurité)
        },

        // Paramètres de notifications
        notifications: merchant.notifications || {
          email: true,
          sms: false,
          push: true,
        },

        // Préférences
        preferences: merchant.preferences || {
          language: 'Français',
          currency: 'EUR',
          timezone: 'Europe/Paris',
        },

        // Informations bancaires
        iban: merchant.iban || null,
        bic: merchant.bic || null,
        paymentPreference: merchant.payment_preference || 'manual',

        // Paramètres de sécurité
        twoFactorEnabled: merchant.two_factor_enabled || false,
        sessionTimeout: merchant.session_timeout || 30,
        messageEnabled: merchant.message_enabled !== false,

        // Dates
        createdAt: merchant.created_at ? new Date(merchant.created_at) : null,
        updatedAt: merchant.updated_at ? new Date(merchant.updated_at) : null,
      });

      console.log('✅ Profil marchand chargé');
    } catch (err) {
      console.error('❌ Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage
  useEffect(() => {
    fetchMerchantData();
  }, []);

  // Recharger automatiquement quand la page redevient visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('🔄 Page visible - Rafraîchissement des données...');
        fetchMerchantData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Utilisateur par défaut (fallback)
  const defaultUser = {
    name: 'Commerce',
    email: '',
    image: null,
  };

  const displayUser = merchantData || defaultUser;

  // === Chargement ===
  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="h-12 bg-surface-hover rounded animate-pulse"></div>
              <div className="h-96 bg-surface-hover rounded animate-pulse"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // === Erreur ===
  if (error || !settings) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8">
            <div className="max-w-5xl mx-auto">
              <div className="liquid-glass p-8">
                <h2 className="text-xl font-bold text-red-600 mb-4">❌ Erreur</h2>
                <p className="text-foreground-muted">{error || 'Impossible de charger le profil'}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <MerchantHeader user={displayUser} />
      <div className="flex">
        <MerchantSidebar />
        <main className="flex-1 p-8 lg:pb-8 pb-24">
          <div className="max-w-5xl mx-auto space-y-6">

            {/* Header avec boutons */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Profil du commerce
                </h1>
                <p className="text-foreground-muted mt-2">
                  Aperçu complet de votre commerce
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Bouton Rafraîchir */}
                <button
                  onClick={() => fetchMerchantData()}
                  disabled={loading}
                  className="bg-surface-hover hover:bg-surface-active text-foreground font-bold py-2 px-4 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Rafraîchir les données"
                >
                  <span className={loading ? 'animate-spin' : ''}>🔄</span>
                  {loading ? 'Chargement...' : 'Rafraîchir'}
                </button>

                {/* Bouton Modifier */}
                <Link
                  href="/merchant/settings"
                  className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  ✏️ Modifier
                </Link>
              </div>
            </div>

            {/* Message d'information si en attente de vérification */}
            {settings.status === 'pending' && !settings.isVerified && (
              <div className="liquid-glass border-2 border-yellow-500/50 bg-yellow-500/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl shrink-0">⏳</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      Votre commerce est en attente de vérification
                    </h3>
                    <p className="text-foreground-muted mb-3">
                      Un administrateur examinera votre demande prochainement. Une fois approuvé, votre commerce sera visible publiquement et vous pourrez commencer à recevoir des commandes.
                    </p>
                    <ul className="space-y-2 text-sm text-foreground-muted">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>En attendant, vous pouvez compléter votre profil et ajouter vos produits</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>La vérification prend généralement 24 à 48 heures</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>Vous recevrez une notification par email dès que votre commerce sera vérifié</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Message si rejeté */}
            {settings.status === 'rejected' && (
              <div className="liquid-glass border-2 border-red-500/50 bg-red-500/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl shrink-0">❌</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      Votre demande a été rejetée
                    </h3>
                    <p className="text-foreground-muted">
                      Malheureusement, votre commerce n'a pas été approuvé. Veuillez contacter le support pour plus d'informations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message si suspendu */}
            {settings.status === 'suspended' && (
              <div className="liquid-glass border-2 border-orange-500/50 bg-orange-500/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="text-3xl shrink-0">🚫</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      Votre commerce est suspendu
                    </h3>
                    <p className="text-foreground-muted">
                      Votre commerce a été temporairement suspendu. Veuillez contacter le support pour résoudre ce problème.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bannière et Logo */}
            <div className="liquid-glass overflow-hidden">
              <div className="relative h-48 bg-linear-to-br from-primary/20 to-secondary/20">
                {settings.bannerUrl ? (
                  <img
                    src={settings.bannerUrl}
                    alt="Bannière"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-6xl opacity-20">🏪</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-start gap-6">
                  {/* Logo */}
                  <div className="w-24 h-24 rounded-full border-4 border-surface bg-white shadow-lg overflow-hidden shrink-0">
                    {settings.logoUrl ? (
                      <img
                        src={settings.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-4xl">
                        🏪
                      </div>
                    )}
                  </div>

                  {/* Infos principales */}
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground">
                      {settings.businessName}
                    </h2>
                    <p className="text-foreground-muted mt-1">
                      {settings.legalName} • SIRET: {settings.siret}
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      {/* Badge de statut contextuel */}
                      {getStatusBadge(settings.status, settings.isVerified, settings.isActive)}
                      <span className="text-sm text-foreground-muted">
                        Type: <span className="font-medium text-foreground">{getMerchantTypeLabel(settings.merchantType as any)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {settings.description && (
              <div className="liquid-glass p-6">
                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                  📝 Description
                </h3>
                <p className="text-foreground-muted leading-relaxed">
                  {settings.description}
                </p>
              </div>
            )}

            {/* Statistiques clés */}
            <div className="liquid-glass p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                📊 Statistiques
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Abonnés */}
                <div className="flex items-center gap-4 p-4 bg-surface-hover rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-3xl">👥</span>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {settings.followersCount || 0}
                    </p>
                    <p className="text-sm text-foreground-muted">Abonnés</p>
                  </div>
                </div>

                {/* Note moyenne */}
                <div className="flex items-center gap-4 p-4 bg-surface-hover rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-3xl">⭐</span>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-foreground">
                      {settings.averageRating ? settings.averageRating.toFixed(1) : '0.0'}
                    </p>
                    <p className="text-sm text-foreground-muted">
                      Note moyenne ({settings.totalReviews || 0} avis)
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2 mt-6">
                🌍 Impact anti-gaspillage
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Items sauvés */}
                <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl">🛟</div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {settings.savedItemsCount || 0}
                      </p>
                      <p className="text-sm text-foreground-muted">Articles sauvés</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Produits sauvés du gaspillage
                  </p>
                </div>

                {/* CO2 économisé */}
                <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl">🌱</div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {settings.co2Saved ? settings.co2Saved.toFixed(1) : '0.0'} kg
                      </p>
                      <p className="text-sm text-foreground-muted">CO₂ économisé</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Équivalent CO₂ non émis
                  </p>
                </div>

                {/* Commandes totales */}
                <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-3xl">🎯</div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {settings.totalOrders || 0}
                      </p>
                      <p className="text-sm text-foreground-muted">Commandes</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground-muted">
                    Commandes complétées
                  </p>
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="liquid-glass p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                📞 Coordonnées
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    📧
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground-muted">Email</p>
                    <a href={`mailto:${settings.email}`} className="text-foreground hover:text-primary transition-colors">
                      {settings.email}
                    </a>
                  </div>
                </div>

                {/* Téléphone */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    📱
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground-muted">Téléphone</p>
                    <a href={`tel:${settings.phone}`} className="text-foreground hover:text-primary transition-colors">
                      {settings.phone}
                    </a>
                  </div>
                </div>

                {/* Site web */}
                {settings.websiteUrl && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      🌐
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground-muted">Site web</p>
                      <a
                        href={settings.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-foreground hover:text-primary transition-colors"
                      >
                        {settings.websiteUrl}
                      </a>
                    </div>
                  </div>
                )}

                {/* Adresse */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    📍
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground-muted">Adresse</p>
                    <p className="text-foreground">
                      {[
                        settings.address,
                        settings.postalCode && settings.city ? `${settings.postalCode} ${settings.city}` : settings.city || settings.postalCode,
                        settings.country !== 'France' ? settings.country : null
                      ].filter(Boolean).join(', ') || 'Non renseignée'}
                    </p>
                    {settings.privacy.showAddress ? (
                      <span className="text-xs text-primary block mt-1">👁️ Visible publiquement</span>
                    ) : (
                      <span className="text-xs text-foreground-muted block mt-1">🔒 Non visible publiquement</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Préférences */}
            <div className="liquid-glass p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                ⚙️ Préférences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-surface-hover rounded-lg">
                  <p className="text-sm font-medium text-foreground-muted mb-2">Langue</p>
                  <p className="text-foreground font-medium">🇫🇷 {settings.preferences.language}</p>
                </div>
                <div className="p-4 bg-surface-hover rounded-lg">
                  <p className="text-sm font-medium text-foreground-muted mb-2">Devise</p>
                  <p className="text-foreground font-medium">€ {settings.preferences.currency}</p>
                </div>
                <div className="p-4 bg-surface-hover rounded-lg">
                  <p className="text-sm font-medium text-foreground-muted mb-2">Fuseau horaire</p>
                  <p className="text-foreground font-medium">🕐 {settings.preferences.timezone}</p>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

// ========================================
// HELPERS
// ========================================

/**
 * Badge de statut contextualisé basé sur la vérification admin
 * 
 * Statuts possibles:
 * - pending: En attente de vérification par l'admin
 * - verified/approved: Commerce vérifié et actif
 * - rejected: Commerce rejeté par l'admin
 * - suspended: Commerce suspendu
 */
function getStatusBadge(status: string, isVerified: boolean, isActive: boolean) {
  // Commerce vérifié par l'admin ET actif
  if ((status === 'verified' || isVerified) && isActive) {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium border bg-green-500/10 text-green-600 border-green-500">
        ✅ Actif et Vérifié
      </span>
    );
  }

  // Commerce vérifié mais inactif (mis en pause par le commerçant)
  if ((status === 'verified' || isVerified) && !isActive) {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium border bg-gray-500/10 text-gray-600 border-gray-500">
        ⏸️ En pause
      </span>
    );
  }

  // Commerce rejeté par l'admin
  if (status === 'rejected') {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium border bg-red-500/10 text-red-600 border-red-500">
        ❌ Rejeté
      </span>
    );
  }

  // Commerce suspendu par l'admin
  if (status === 'suspended') {
    return (
      <span className="px-3 py-1 rounded-full text-sm font-medium border bg-orange-500/10 text-orange-600 border-orange-500">
        🚫 Suspendu
      </span>
    );
  }

  // Par défaut: En attente de vérification par l'admin
  return (
    <span className="px-3 py-1 rounded-full text-sm font-medium border bg-yellow-500/10 text-yellow-600 border-yellow-500">
      ⏳ En attente de vérification
    </span>
  );
}


