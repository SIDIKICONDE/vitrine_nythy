/**
 * MerchantStats - Statistiques du marchand
 */

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ icon, label, value, subtitle, trend }: StatCardProps) {
  return (
    <div className="liquid-glass p-6">
      <div className="flex items-start justify-between mb-2">
        <div className="text-3xl">{icon}</div>
        {trend && (
          <div className={`text-sm font-medium ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm text-foreground-muted mb-1">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
        {subtitle && (
          <p className="text-xs text-foreground-subtle mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

interface MerchantStatsProps {
  stats: {
    totalOrders: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
    followersCount: number;
    productsCount: number;
    savedItemsCount: number;
    co2Saved: number;
  };
  trends?: {
    orders?: number;
    revenue?: number;
    followers?: number;
  };
}

export default function MerchantStats({ stats, trends }: MerchantStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Commandes */}
      <StatCard
        icon="📦"
        label="Commandes"
        value={stats.totalOrders}
        subtitle="Total des commandes"
        trend={trends?.orders ? {
          value: trends.orders,
          isPositive: trends.orders > 0
        } : undefined}
      />

      {/* Chiffre d'affaires */}
      <StatCard
        icon="💰"
        label="Chiffre d'affaires"
        value={`${stats.totalRevenue.toLocaleString('fr-FR')}€`}
        subtitle="Total des ventes"
        trend={trends?.revenue ? {
          value: trends.revenue,
          isPositive: trends.revenue > 0
        } : undefined}
      />

      {/* Note moyenne */}
      <StatCard
        icon="⭐"
        label="Note moyenne"
        value={stats.averageRating.toFixed(1)}
        subtitle={`${stats.totalReviews} avis`}
      />

      {/* Abonnés */}
      <StatCard
        icon="👥"
        label="Abonnés"
        value={stats.followersCount}
        subtitle="Suivent votre commerce"
        trend={trends?.followers ? {
          value: trends.followers,
          isPositive: trends.followers > 0
        } : undefined}
      />

      {/* Produits actifs */}
      <StatCard
        icon="🍽️"
        label="Produits actifs"
        value={stats.productsCount}
        subtitle="Disponibles actuellement"
      />

      {/* Produits sauvés */}
      <StatCard
        icon="🛟"
        label="Produits sauvés"
        value={stats.savedItemsCount}
        subtitle="Du gaspillage alimentaire"
      />

      {/* Impact CO2 */}
      <StatCard
        icon="🌱"
        label="Impact CO₂"
        value={`${stats.co2Saved} kg`}
        subtitle="De CO₂ économisés"
      />

      {/* Taux de conversion */}
      <StatCard
        icon="📊"
        label="Taux conversion"
        value={stats.totalOrders > 0 
          ? `${((stats.savedItemsCount / (stats.totalOrders * 2)) * 100).toFixed(1)}%`
          : '0%'
        }
        subtitle="Visiteurs → Clients"
      />
    </div>
  );
}

