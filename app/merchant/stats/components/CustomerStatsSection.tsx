/**
 * CustomerStatsSection - Section statistiques clients
 */

'use client';

import { MerchantSalesStats } from '@/app/merchant/domain/entities/MerchantSalesStats';

interface CustomerStatsSectionProps {
  stats: MerchantSalesStats;
}

export default function CustomerStatsSection({ stats }: CustomerStatsSectionProps) {
  const totalCustomers = stats.returningCustomers + stats.newCustomers;
  const newCustomerRate = totalCustomers > 0 ? (stats.newCustomers / totalCustomers) * 100 : 0;
  const returningCustomerRate = totalCustomers > 0 ? (stats.returningCustomers / totalCustomers) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Résumé clients */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Total clients</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {totalCustomers}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Clients uniques
          </p>
        </div>

        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Nouveaux clients</h3>
            <span className="text-2xl">🆕</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {stats.newCustomers}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            {newCustomerRate.toFixed(1)}% du total
          </p>
        </div>

        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Clients récurrents</h3>
            <span className="text-2xl">🔄</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats.returningCustomers}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            {stats.returningCustomers + stats.newCustomers > 0
              ? ((stats.returningCustomers / (stats.returningCustomers + stats.newCustomers)) * 100).toFixed(1)
              : '0'} du total
          </p>
        </div>
      </div>

      {/* Graphique de répartition */}
      <div className="liquid-glass p-6 rounded-xl">
        <h3 className="text-lg font-bold text-foreground mb-4">Répartition des clients</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Clients récurrents</span>
              <span className="text-sm font-bold text-foreground">
                {stats.returningCustomers} ({returningCustomerRate.toFixed(1)}%)
              </span>
            </div>
            <div className="h-4 bg-surface-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-green-600 rounded-full transition-all duration-500"
                style={{ width: `${returningCustomerRate}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Nouveaux clients</span>
              <span className="text-sm font-bold text-foreground">
                {stats.newCustomers} ({newCustomerRate.toFixed(1)}%)
              </span>
            </div>
            <div className="h-4 bg-surface-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${newCustomerRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques de fidélité */}
      <div className="liquid-glass p-6 rounded-xl">
        <h3 className="text-lg font-bold text-foreground mb-4">Fidélité client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-surface-hover rounded-lg">
            <p className="text-sm text-foreground-muted mb-1">Taux de rétention</p>
            <p className="text-2xl font-bold text-green-600">
              {returningCustomerRate.toFixed(1)}%
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              Clients qui reviennent
            </p>
          </div>
          <div className="p-4 bg-surface-hover rounded-lg">
            <p className="text-sm text-foreground-muted mb-1">Taux de conversion</p>
            <p className="text-2xl font-bold text-primary">
              {stats.conversionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              Visiteurs → Clients
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

