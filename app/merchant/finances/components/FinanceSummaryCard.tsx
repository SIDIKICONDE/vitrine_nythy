/**
 * FinanceSummaryCard - Carte de résumé financier
 */

'use client';

import { FinanceSummary } from '@/app/merchant/domain/entities/FinanceSummary';

interface FinanceSummaryCardProps {
  summary: FinanceSummary;
}

export default function FinanceSummaryCard({ summary }: FinanceSummaryCardProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Première ligne : Revenus et Commissions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenus totaux */}
        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Revenus totaux</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {summary.totalRevenue.formatted}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            {summary.totalOrders} commandes
          </p>
        </div>

        {/* Commissions totales */}
        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Commissions</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {summary.totalCommissions.formatted}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            {summary.averageCommissionRate.toFixed(2)}% en moyenne
          </p>
        </div>

        {/* Revenus nets */}
        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Revenus nets</h3>
            <span className="text-2xl">💵</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {summary.netRevenue.formatted}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Après frais et commissions
          </p>
        </div>

        {/* Solde disponible */}
        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Solde disponible</h3>
            <span className="text-2xl">💳</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {summary.availableBalance.formatted}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Prêt pour versement
          </p>
        </div>
      </div>

      {/* Deuxième ligne : Versements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Versements totaux */}
        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Versements totaux</h3>
            <span className="text-2xl">💸</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {summary.totalPayouts.formatted}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Total versé
          </p>
        </div>

        {/* Versements en attente */}
        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Versements en attente</h3>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {summary.pendingPayouts.formatted}
          </p>
          {summary.nextPayoutDate && (
            <p className="text-xs text-foreground-muted mt-1">
              Prochain versement: {new Date(summary.nextPayoutDate).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

