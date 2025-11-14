/**
 * SalesStatsSection - Section statistiques de ventes
 */

'use client';

import { MerchantSalesStats } from '@/app/merchant/domain/entities/MerchantSalesStats';

interface SalesStatsSectionProps {
  stats: MerchantSalesStats;
}

export default function SalesStatsSection({ stats }: SalesStatsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Cartes de résumé */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Revenus totaux</h3>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.totalRevenue.formatted}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            {stats.totalOrders} commandes
          </p>
        </div>

        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Panier moyen</h3>
            <span className="text-2xl">🛒</span>
          </div>
          <p className="text-2xl font-bold text-primary">
            {stats.averageOrderValue.formatted}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Par commande
          </p>
        </div>

        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Taux de conversion</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats.conversionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            Visiteurs → Clients
          </p>
        </div>

        <div className="liquid-glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground-muted">Clients récurrents</h3>
            <span className="text-2xl">🔄</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {stats.returningCustomers}
          </p>
          <p className="text-xs text-foreground-muted mt-1">
            {stats.returningCustomers + stats.newCustomers > 0
              ? `${((stats.returningCustomers / (stats.returningCustomers + stats.newCustomers)) * 100).toFixed(1)}% du total`
              : '0% du total'}
          </p>
        </div>
      </div>

      {/* Graphique des revenus */}
      {stats.revenueByDay && stats.revenueByDay.length > 0 && (
        <div className="liquid-glass p-6 rounded-xl">
          <h3 className="text-lg font-bold text-foreground mb-4">Évolution des revenus</h3>
          <div className="space-y-2">
            {stats.revenueByDay.slice(-14).map((day, index) => {
              const maxRevenue = Math.max(...stats.revenueByDay!.map(d => d.revenue.amountDecimal));
              const percentage = (day.revenue.amountDecimal / maxRevenue) * 100;

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-24 text-xs text-foreground-muted">
                    {new Date(day.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="flex-1 relative">
                    <div className="h-8 bg-surface-hover rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-primary to-secondary rounded-lg transition-all duration-300 flex items-center justify-between px-3"
                        style={{ width: `${percentage}%` }}
                      >
                        <span className="text-xs font-medium text-white whitespace-nowrap">
                          {day.orders} commandes
                        </span>
                        <span className="text-xs font-medium text-white whitespace-nowrap">
                          {day.revenue.formatted}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top produits */}
      {stats.topSellingProducts && stats.topSellingProducts.length > 0 && (
        <div className="liquid-glass p-6 rounded-xl">
          <h3 className="text-lg font-bold text-foreground mb-4">Produits les plus vendus</h3>
          <div className="space-y-3">
            {stats.topSellingProducts.map((product, index) => (
              <div
                key={product.productId}
                className="flex items-center justify-between p-4 bg-surface-hover rounded-lg border border-border"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{product.productName}</p>
                    <p className="text-sm text-foreground-muted">
                      {product.quantitySold} ventes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {product.revenue.formatted}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

