/**
 * Page des finances
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
 *    - GetFinanceSummaryUseCase: Résumé financier
 *    - GetTransactionsUseCase: Liste des transactions
 *    - GetPayoutsUseCase: Historique des versements
 * 
 * 3. HOOKS
 *    - useFinance: Encapsule la logique métier et les use cases
 * 
 * 4. COMPOSANTS
 *    - FinanceSummaryCard: Résumé financier
 *    - TransactionsList: Liste des transactions
 *    - PayoutsList: Historique des versements
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import { createApiFinanceRepository } from '@/app/merchant/infrastructure/api/ApiFinanceRepository';
import { useFinance } from '@/hooks/useFinance';
import { useEffect, useMemo, useState } from 'react';
import FinanceSummaryCard from './components/FinanceSummaryCard';
import PayoutsList from './components/PayoutsList';
import TransactionsList from './components/TransactionsList';

export default function FinancesPage() {
  // ⚠️ MODE TEST
  const testUser = {
    name: 'Marchand Test',
    email: 'test@marchand.nythy.com',
    image: null,
  };

  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Récupérer le merchantId
  useEffect(() => {
    const fetchMerchant = async () => {
      try {
        console.log('🔍 Récupération du merchant...');
        const response = await fetch('/api/merchant/me');
        const result = await response.json();

        if (response.ok && result.success) {
          setMerchantId(result.merchant.id);
          console.log('✅ Merchant ID:', result.merchant.id);
        } else {
          // Afficher un message d'erreur plus explicite
          const errorMessage = result.message || 'Commerce non trouvé';
          console.error('❌ Erreur API:', errorMessage);
          setApiError(errorMessage);
        }
      } catch (err) {
        console.error('❌ Erreur:', err);
        setApiError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      }
    };

    fetchMerchant();
  }, []);

  // Créer le repository API une fois qu'on a le merchantId (mémorisé pour éviter les re-renders)
  const financeRepository = useMemo(() => {
    if (!merchantId || merchantId === 'temp' || merchantId === '') {
      return null;
    }
    return createApiFinanceRepository(merchantId);
  }, [merchantId]);

  // Utiliser le hook useFinance seulement si on a un merchantId valide
  // Si pas de repository valide, on passe des valeurs par défaut pour éviter les erreurs
  const defaultRepository = useMemo(() => createApiFinanceRepository('temp'), []);
  const {
    summary,
    transactions,
    payouts,
    loading,
    error,
    refreshSummary,
    resetError,
  } = useFinance(merchantId || '', financeRepository || defaultRepository);

  // État pour la période sélectionnée
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all'>('monthly');

  // Gérer le changement de période
  const handlePeriodChange = async (period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all') => {
    setSelectedPeriod(period);
    try {
      await refreshSummary(period);
    } catch (err) {
      console.error('Erreur lors du changement de période:', err);
    }
  };

  // Afficher un message de chargement si merchantId n'est pas encore chargé
  if (!merchantId && !apiError) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={testUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8 lg:pb-8 pb-24">
            <div className="max-w-7xl mx-auto">
              <div className="liquid-glass p-12 text-center">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <p className="text-foreground-muted">Chargement...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <MerchantHeader user={testUser} />
      <div className="flex">
        <MerchantSidebar />
        <main className="flex-1 p-8 lg:pb-8 pb-24">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Erreur API */}
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div className="flex-1">
                    <p className="font-bold text-lg mb-1">Erreur</p>
                    <p className="text-sm mb-3">{apiError}</p>
                    {apiError.includes('inscrire') && (
                      <a
                        href="/merchant/register"
                        className="inline-flex items-center gap-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        <span>📝</span>
                        <span>S'inscrire comme marchand</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* En-tête de page */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Finances
                </h1>
                <p className="text-foreground-muted">
                  Gérez vos revenus, versements et transactions
                </p>
              </div>

              {/* Sélecteur de période */}
              <div className="flex gap-2">
                {(['daily', 'weekly', 'monthly', 'yearly', 'all'] as const).map((period) => (
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
                        period === 'monthly' ? 'Mois' :
                          period === 'yearly' ? 'Année' : 'Tout'}
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
            {loading && !summary && (
              <div className="liquid-glass p-12 text-center">
                <p className="text-foreground-muted">Chargement des données financières...</p>
              </div>
            )}

            {/* Message de bienvenue pour nouveau marchand */}
            {summary && summary.totalOrders === 0 && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">👋</span>
                  <div>
                    <h3 className="font-bold text-lg mb-1">Bienvenue sur votre espace finances !</h3>
                    <p className="text-sm text-blue-700">
                      Vous n'avez pas encore de commandes. Vos revenus et statistiques apparaîtront ici dès que vos premiers clients passeront commande.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Résumé financier */}
            {summary && <FinanceSummaryCard summary={summary} />}

            {/* Contenu principal */}
            {!loading && summary && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transactions */}
                <div>
                  <TransactionsList transactions={transactions} loading={loading} />
                </div>

                {/* Versements */}
                <div>
                  <PayoutsList payouts={payouts} loading={loading} />
                </div>
              </div>
            )}

            {/* Informations supplémentaires */}
            {summary && summary.totalOrders > 0 && (
              <div className="liquid-glass p-6 rounded-xl">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Informations financières
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Taux de commission moyen</p>
                    <p className="text-xl font-bold text-foreground">
                      {summary.averageCommissionRate.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Pourcentage versé</p>
                    <p className="text-xl font-bold text-foreground">
                      {summary.payoutPercentage.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Valeur moyenne commande</p>
                    <p className="text-xl font-bold text-foreground">
                      {summary.averageOrderValue.formatted}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Message d'encouragement pour nouveau marchand */}
            {summary && summary.totalOrders === 0 && (
              <div className="liquid-glass p-8 rounded-xl text-center">
                <div className="max-w-2xl mx-auto">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">
                    Prêt à commencer ?
                  </h3>
                  <p className="text-foreground-muted mb-6">
                    Créez vos premiers produits anti-gaspillage et commencez à générer des revenus tout en réduisant le gaspillage alimentaire.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                    <div className="bg-surface-hover p-4 rounded-lg">
                      <div className="text-2xl mb-2">📦</div>
                      <h4 className="font-semibold mb-1">1. Ajoutez des produits</h4>
                      <p className="text-sm text-foreground-muted">
                        Créez vos premiers produits ou paniers surprise
                      </p>
                    </div>
                    <div className="bg-surface-hover p-4 rounded-lg">
                      <div className="text-2xl mb-2">🛍️</div>
                      <h4 className="font-semibold mb-1">2. Recevez des commandes</h4>
                      <p className="text-sm text-foreground-muted">
                        Les clients découvrent vos offres
                      </p>
                    </div>
                    <div className="bg-surface-hover p-4 rounded-lg">
                      <div className="text-2xl mb-2">💸</div>
                      <h4 className="font-semibold mb-1">3. Recevez vos paiements</h4>
                      <p className="text-sm text-foreground-muted">
                        Versements automatiques chaque semaine
                      </p>
                    </div>
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
