/**
 * DashboardStats - Statistiques du dashboard marchand
 */

'use client';

import { useEffect, useState } from 'react';
import MerchantStats from '../MerchantStats';
import apiDashboardRepository from '../infrastructure/api/ApiDashboardRepository';

interface DashboardStatsProps {
  initialStats?: any;
  initialTrends?: any;
}

export default function DashboardStats({ initialStats, initialTrends }: DashboardStatsProps = {}) {
  const [stats, setStats] = useState(initialStats || {
    totalOrders: 0,
    totalRevenue: 0,
    averageRating: 0,
    totalReviews: 0,
    followersCount: 0,
    productsCount: 0,
    savedItemsCount: 0,
    co2Saved: 0,
  });

  const [trends, setTrends] = useState(initialTrends || {
    orders: 0,
    revenue: 0,
    followers: 0,
  });

  const [loading, setLoading] = useState(!initialStats);

  useEffect(() => {
    // Si on a déjà les données initiales, ne pas refaire l'appel API
    if (initialStats && initialTrends) {
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);

        // 1. Récupérer le merchantId
        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          throw new Error(merchantResult.message || 'Erreur lors de la récupération du commerce');
        }

        const merchantId = merchantResult.merchant.id;

        // 2. Récupérer les stats du dashboard
        const { stats: apiStats, trends: apiTrends } = await apiDashboardRepository.getStats(merchantId);

        setStats(apiStats);
        setTrends(apiTrends);
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [initialStats, initialTrends]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="liquid-glass p-6 animate-pulse">
            <div className="h-8 bg-surface-hover rounded mb-4"></div>
            <div className="h-10 bg-surface-hover rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return <MerchantStats stats={stats} trends={trends} />;
}

