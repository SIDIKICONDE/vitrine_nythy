'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { AdminStats } from '@/types/admin';
import {
  Activity,
  AlertCircle,
  DollarSign,
  Headphones,
  Image as ImageIcon,
  Package,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { ReactElement, useEffect, useState } from 'react';

/**
 * Page principale du dashboard d'administration
 */
export default function AdminDashboardPage(): ReactElement {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/dashboard');

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du dashboard');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          </div>

          {/* Stats Grid Skeleton */}
          <ResponsiveGrid columns={{ initial: 1, sm: 2, lg: 4 }} gap="sm">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-40 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse"
              />
            ))}
          </ResponsiveGrid>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Erreur de chargement
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <button
              onClick={loadDashboard}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all hover:shadow-lg"
            >
              <RefreshCw className="w-5 h-5" />
              Réessayer
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!stats) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Aucune donnée disponible
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Vue d'ensemble de la plateforme Nythy
            </p>
          </div>
          <button
            onClick={loadDashboard}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>

        {/* Stats Grid */}
        <ResponsiveGrid columns={{ initial: 1, sm: 2, lg: 4 }} gap={{ initial: 'sm', md: 'md' }}>
          {/* Utilisateurs Totaux */}
          <StatCard
            title="Utilisateurs"
            value={stats.totalUsers.toLocaleString()}
            icon={Users}
            color="#3b82f6"
            subtitle={`${stats.activeUsers} actifs`}
            trend={stats.todayUsers > 0}
            trendPercentage={`+${stats.todayUsers} aujourd'hui`}
          />

          {/* Commerces */}
          <StatCard
            title="Commerces"
            value={stats.totalMerchants.toLocaleString()}
            icon={Store}
            color="#10b981"
            subtitle={`${stats.verifiedMerchants} vérifiés, ${stats.pendingMerchants} en attente`}
          />

          {/* Commandes */}
          <StatCard
            title="Commandes"
            value={stats.totalOrders.toLocaleString()}
            icon={ShoppingBag}
            color="#f59e0b"
            subtitle={`${stats.todayOrders} aujourd'hui`}
            trend={stats.todayOrders > 0}
            trendPercentage={`+${stats.todayOrders}`}
          />

          {/* Revenu */}
          <StatCard
            title="Revenu Total"
            value={`${stats.totalRevenue.toFixed(2)} €`}
            icon={DollarSign}
            color="#8b5cf6"
            subtitle={`${stats.todayRevenue.toFixed(2)} € aujourd'hui`}
            trend={stats.todayRevenue > 0}
            trendPercentage={`+${stats.todayRevenue.toFixed(2)} €`}
          />

          {/* Offres */}
          <StatCard
            title="Offres"
            value={stats.totalOffers.toLocaleString()}
            icon={Package}
            color="#ec4899"
            subtitle={`${stats.activeOffers} actives`}
          />

          {/* Utilisateurs Bannis */}
          <StatCard
            title="Utilisateurs Bannis"
            value={stats.bannedUsers.toLocaleString()}
            icon={Users}
            color="#ef4444"
          />

          {/* Parrainages */}
          <StatCard
            title="Parrainages"
            value={stats.totalReferrals.toLocaleString()}
            icon={UserPlus}
            color="#06b6d4"
            subtitle={`${stats.todayReferrals} aujourd'hui`}
            trend={stats.todayReferrals > 0}
            trendPercentage={`+${stats.todayReferrals}`}
          />

          {/* Récompenses Parrainage */}
          <StatCard
            title="Récompenses"
            value={`${stats.totalReferralRewards.toFixed(2)} €`}
            icon={TrendingUp}
            color="#14b8a6"
            subtitle="Total parrainages"
          />
        </ResponsiveGrid>

        {/* Statistiques SVG */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-amber-600" />
            Médias des Commerces
          </h2>
          <ResponsiveGrid columns={{ initial: 1, md: 2 }} gap="md">
            <div className="group p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Logos SVG</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">
                    {stats.merchantsWithSvgLogos}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    sur <span className="font-semibold">{stats.totalMerchants}</span> commerces
                  </p>
                  <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-linear-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.merchantsWithSvgLogos / stats.totalMerchants) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-5xl group-hover:scale-110 transition-transform">🎨</div>
              </div>
            </div>

            <div className="group p-6 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Bannières SVG</p>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white">
                    {stats.merchantsWithSvgBanners}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    sur <span className="font-semibold">{stats.totalMerchants}</span> commerces
                  </p>
                  <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-linear-to-r from-purple-500 to-pink-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(stats.merchantsWithSvgBanners / stats.totalMerchants) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-5xl group-hover:scale-110 transition-transform">🖼️</div>
              </div>
            </div>
          </ResponsiveGrid>
        </div>

        {/* Actions rapides */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="w-6 h-6 text-amber-600" />
            Actions Rapides
          </h2>
          <ResponsiveGrid columns={{ initial: 1, md: 2, lg: 3 }} gap="md">
            <Link
              href="/admin/merchants?status=pending"
              className="group p-6 bg-linear-to-br from-amber-500 to-orange-600 rounded-2xl text-white hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <Store className="w-8 h-8 group-hover:scale-110 transition-transform" />
                {stats.pendingMerchants > 0 && (
                  <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
                    {stats.pendingMerchants}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold mb-1">Valider des commerces</h3>
              <p className="text-sm text-white/80">
                {stats.pendingMerchants} en attente de validation
              </p>
            </Link>

            <Link
              href="/admin/reports"
              className="group p-6 bg-linear-to-br from-red-500 to-pink-600 rounded-2xl text-white hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <AlertCircle className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-lg font-bold mb-1">Traiter les signalements</h3>
              <p className="text-sm text-white/80">Modération en attente</p>
            </Link>

            <Link
              href="/admin/support"
              className="group p-6 bg-linear-to-br from-blue-500 to-cyan-600 rounded-2xl text-white hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="flex items-start justify-between mb-3">
                <Headphones className="w-8 h-8 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-lg font-bold mb-1">Support utilisateurs</h3>
              <p className="text-sm text-white/80">Tickets ouverts</p>
            </Link>
          </ResponsiveGrid>
        </div>
      </div>
    </AdminLayout>
  );
}
