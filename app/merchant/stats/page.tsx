/**
 * Page des statistiques détaillées
 * 
 * ✅ ARCHITECTURE DDD COMPLÈTE
 * 
 * Cette page suit les principes Domain-Driven Design:
 * 
 * 1. SÉPARATION DES COUCHES
 *    - Présentation (ce fichier): UI et gestion des événements
 *    - Domaine: Use Cases, Entities, Value Objects (domain/)
 *    - Infrastructure: Repositories, Services (infrastructure/)
 * 
 * 2. USE CASES UTILISÉS
 *    - GetMerchantSalesStatsUseCase: Statistiques de ventes
 *    - GetMerchantStatisticsUseCase: Statistiques d'impact
 * 
 * 3. HOOKS
 *    - useStatistics: Encapsule la logique métier et les use cases
 * 
 * 4. COMPOSANTS
 *    - SalesStatsSection: Statistiques de ventes
 *    - ImpactStatsSection: Statistiques d'impact environnemental
 *    - CustomerStatsSection: Statistiques clients
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import apiMerchantRepository from '@/app/merchant/infrastructure/api/ApiMerchantRepository';
import { useStatistics } from '@/hooks/useStatistics';
import { useEffect, useState } from 'react';
import CustomerStatsSection from './components/CustomerStatsSection';
import ImpactStatsSection from './components/ImpactStatsSection';
import SalesStatsSection from './components/SalesStatsSection';

export default function StatsPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantData, setMerchantData] = useState<{ name: string; email: string; image: string | null } | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [initialError, setInitialError] = useState<string | null>(null);

  // Charger le merchantId au démarrage
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
      } catch (err) {
        console.error('Erreur chargement marchand:', err);
        setInitialError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setInitialLoading(false);
      }
    };

    loadMerchantData();
  }, []);

  // Utiliser le repository API
  const merchantRepository = apiMerchantRepository;

  // Utiliser le hook useStatistics
  const {
    salesStats,
    impactStats,
    loading,
    error,
    refreshSalesStats,
    resetError,
  } = useStatistics(merchantId || 'temp', merchantRepository);

  // État pour la période sélectionnée
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Gérer le changement de période
  const handlePeriodChange = async (period: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    if (!merchantId) return;

    setSelectedPeriod(period);
    try {
      await refreshSalesStats(period);
    } catch (err) {
      console.error('Erreur lors du changement de période:', err);
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
  if (initialLoading || (loading && !salesStats && !impactStats)) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8 lg:pb-8 pb-24">
            <div className="max-w-7xl mx-auto">
              <div className="liquid-glass p-12 text-center">
                <p className="text-foreground-muted">Chargement des statistiques...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // === Erreur initiale ===
  if (initialError) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8 lg:pb-8 pb-24">
            <div className="max-w-7xl mx-auto">
              <div className="liquid-glass p-8 text-center">
                <h2 className="text-xl font-bold text-red-600 mb-4">❌ Erreur</h2>
                <p className="text-foreground-muted mb-4">{initialError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
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

  // === Pas de merchantId ===
  if (!merchantId) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8 lg:pb-8 pb-24">
            <div className="max-w-7xl mx-auto">
              <div className="liquid-glass p-8 text-center">
                <h2 className="text-xl font-bold text-red-600 mb-4">❌ Erreur</h2>
                <p className="text-foreground-muted mb-4">Commerce non trouvé</p>
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
          <div className="max-w-7xl mx-auto space-y-6">
            {/* En-tête de page */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Statistiques détaillées
                </h1>
                <p className="text-foreground-muted">
                  Analysez vos performances et votre impact anti-gaspillage
                </p>
              </div>

              {/* Sélecteur de période */}
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => handlePeriodChange(period)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedPeriod === period
                      ? 'bg-primary text-white'
                      : 'bg-surface-hover text-foreground hover:bg-surface-active'
                      }`}
                  >
                    {period === 'daily' ? 'Jour' :
                      period === 'weekly' ? 'Semaine' :
                        period === 'monthly' ? 'Mois' : 'Année'}
                  </button>
                ))}
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-red-700 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="font-medium">Erreur</p>
                    <p className="text-sm">{error}</p>
                  </div>
                  <button
                    onClick={resetError}
                    className="text-red-700 hover:text-red-900"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Chargement */}
            {loading && !salesStats && !impactStats && (
              <div className="liquid-glass p-12 text-center">
                <p className="text-foreground-muted">Chargement des statistiques...</p>
              </div>
            )}

            {/* Statistiques de ventes */}
            {salesStats && (
              <SalesStatsSection stats={salesStats} />
            )}

            {/* Statistiques clients */}
            {salesStats && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  👥 Statistiques clients
                </h2>
                <CustomerStatsSection stats={salesStats} />
              </div>
            )}

            {/* Statistiques d'impact */}
            {impactStats && (
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  🌱 Impact environnemental
                </h2>
                <ImpactStatsSection stats={impactStats} />
              </div>
            )}

            {/* Informations supplémentaires */}
            {salesStats && (
              <div className="liquid-glass p-6 rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Informations complémentaires
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Produits vendus</p>
                    <p className="text-xl font-bold text-foreground">
                      {salesStats.totalItemsSold}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Produits sauvés</p>
                    <p className="text-xl font-bold text-green-600">
                      {salesStats.totalItemsSaved}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Période analysée</p>
                    <p className="text-xl font-bold text-foreground">
                      {new Date(salesStats.startDate).toLocaleDateString('fr-FR')} - {new Date(salesStats.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
