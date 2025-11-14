/**
 * DashboardContent - Contenu du dashboard avec données préchargées
 */

'use client';

import ActivityFeed from '@/app/merchant/dashboard/ActivityFeed';
import DashboardStats from '@/app/merchant/dashboard/DashboardStats';
import PerformanceChart from '@/app/merchant/dashboard/PerformanceChart';
import QuickActions from '@/app/merchant/dashboard/QuickActions';
import RecentOrders from '@/app/merchant/dashboard/RecentOrders';
import TopProducts from '@/app/merchant/dashboard/TopProducts';

interface DashboardContentProps {
  dashboardData: {
    stats: any;
    trends: any;
    recentOrders: any[];
    topProducts: any[];
    weeklyRevenue: any[];
    activities: any[];
  } | null;
}

export default function DashboardContent({ dashboardData }: DashboardContentProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Dashboard
          </h1>
          <p className="mt-2 text-foreground-muted">
            Vue d'ensemble de votre activité anti-gaspillage
          </p>
        </div>

        <div className="text-right">
          <p className="text-sm text-foreground-muted">Dernière mise à jour</p>
          <p className="text-sm font-medium text-foreground">
            {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Si pas de données, afficher un message ou laisser les composants charger par eux-mêmes */}
      {!dashboardData ? (
        <div className="space-y-8">
          {/* Stats */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">
              📊 Statistiques clés
            </h2>
            <DashboardStats />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart />
            <TopProducts />
          </div>

          {/* Activity Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentOrders />
            </div>
            <div className="lg:col-span-1">
              <ActivityFeed />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats avec données préchargées */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">
              📊 Statistiques clés
            </h2>
            <DashboardStats 
              initialStats={dashboardData.stats} 
              initialTrends={dashboardData.trends} 
            />
          </div>

          {/* Charts Row avec données préchargées */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceChart 
              initialData={{
                labels: dashboardData.weeklyRevenue.map(item => item.label),
                values: dashboardData.weeklyRevenue.map(item => item.value),
              }} 
            />
            <TopProducts 
              initialProducts={dashboardData.topProducts} 
            />
          </div>

          {/* Activity Row avec données préchargées */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentOrders 
                initialOrders={dashboardData.recentOrders} 
              />
            </div>
            <div className="lg:col-span-1">
              <ActivityFeed 
                initialActivities={dashboardData.activities} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="liquid-glass p-6 bg-linear-to-br from-primary/5 to-secondary/5">
        <div className="flex items-start gap-4">
          <div className="text-4xl">💡</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-foreground mb-2">
              Conseil du jour
            </h3>
            <p className="text-foreground-muted">
              Pensez à créer vos produits anti-gaspillage en fin de journée pour maximiser vos ventes
              et réduire le gaspillage. Les clients recherchent activement des offres entre 17h et 20h.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

