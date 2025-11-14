/**
 * ImpactStatsSection - Section statistiques d'impact environnemental
 */

'use client';

import { MerchantStatistics } from '@/app/merchant/domain/usecases/GetMerchantStatisticsUseCase';

interface ImpactStatsSectionProps {
  stats: MerchantStatistics;
}

export default function ImpactStatsSection({ stats }: ImpactStatsSectionProps) {
  const formatMoney = (centimes: number): string => {
    return `${(centimes / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
  };

  const getImpactScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getImpactScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Très bon';
    if (score >= 40) return 'Bon';
    return 'À améliorer';
  };

  return (
    <div className="space-y-6">
      {/* Score d'impact */}
      <div className="liquid-glass p-6 rounded-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">Score d'impact</h3>
          <span className={`text-2xl font-bold ${getImpactScoreColor(stats.impactScore)}`}>
            {stats.impactScore}/100
          </span>
        </div>
        <div className="relative h-6 bg-surface-hover rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${stats.impactScore >= 80 ? 'bg-green-600' :
                stats.impactScore >= 60 ? 'bg-blue-600' :
                  stats.impactScore >= 40 ? 'bg-orange-600' : 'bg-red-600'
              }`}
            style={{ width: `${stats.impactScore}%` }}
          />
        </div>
        <p className="text-sm text-foreground-muted mt-2">
          {getImpactScoreLabel(stats.impactScore)} - Basé sur vos produits sauvés, CO₂ économisé et nombre de clients
        </p>
      </div>

      {/* Cartes d'impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Produits sauvés</h3>
            <span className="text-2xl">🛟</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats.totalItemsSaved.toLocaleString('fr-FR')}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Du gaspillage alimentaire
          </p>
        </div>

        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">CO₂ économisé</h3>
            <span className="text-2xl">🌱</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats.totalCO2Saved.toFixed(1)} kg
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Émissions évitées
          </p>
        </div>

        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Argent distribué</h3>
            <span className="text-2xl">💵</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {formatMoney(stats.totalMoneyDistributed)}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Économies pour les clients
          </p>
        </div>

        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Clients servis</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {stats.totalCustomers}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Clients uniques
          </p>
        </div>
      </div>

      {/* Détails de l'impact */}
      <div className="liquid-glass p-6 rounded-xl">
        <h3 className="text-lg font-bold text-foreground mb-4">Détails de l'impact</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-surface-hover rounded-lg">
            <p className="text-sm text-foreground-muted mb-1">Équivalent en repas</p>
            <p className="text-xl font-bold text-foreground">
              ~{Math.round(stats.totalItemsSaved / 2)} repas
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              Basé sur 2 items par repas
            </p>
          </div>
          <div className="p-4 bg-surface-hover rounded-lg">
            <p className="text-sm text-foreground-muted mb-1">Équivalent en km</p>
            <p className="text-xl font-bold text-foreground">
              ~{Math.round(stats.totalCO2Saved * 4.5)} km
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              En voiture (4.5 kg CO₂/100km)
            </p>
          </div>
          <div className="p-4 bg-surface-hover rounded-lg">
            <p className="text-sm text-foreground-muted mb-1">Économie moyenne</p>
            <p className="text-xl font-bold text-foreground">
              {formatMoney(Math.round(stats.totalMoneyDistributed / stats.totalCustomers))}
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              Par client
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

