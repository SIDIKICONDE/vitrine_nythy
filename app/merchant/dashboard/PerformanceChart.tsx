/**
 * PerformanceChart - Graphique de performance
 */

'use client';

import apiDashboardRepository from '@/app/merchant/infrastructure/api/ApiDashboardRepository';
import { useEffect, useState } from 'react';

interface ChartData {
  labels: string[];
  values: number[];
}

interface PerformanceChartProps {
  initialData?: ChartData;
}

export default function PerformanceChart({ initialData }: PerformanceChartProps = {}) {
  const [data, setData] = useState<ChartData>(initialData || { labels: [], values: [] });
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    // Si on a déjà les données initiales, ne pas refaire l'appel API
    if (initialData) {
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Récupérer le merchantId
        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          throw new Error(merchantResult.message || 'Erreur lors de la récupération du commerce');
        }

        const merchantId = merchantResult.merchant.id;

        // 2. Récupérer les revenus hebdomadaires
        const weeklyRevenue = await apiDashboardRepository.getWeeklyRevenue(merchantId);

        // Convertir les données pour le graphique
        setData({
          labels: weeklyRevenue.map(item => item.label),
          values: weeklyRevenue.map(item => item.value),
        });
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [initialData]);

  if (loading) {
    return (
      <div className="liquid-glass p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-surface-hover rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-surface-hover rounded"></div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.values);
  const chartHeight = 200;

  return (
    <div className="liquid-glass p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Performance des ventes (4 semaines)
        </h2>
      </div>

      {/* Simple bar chart */}
      <div className="relative" style={{ height: chartHeight }}>
        <div className="flex items-end justify-between h-full gap-2">
          {data.values.map((value, index) => {
            const barHeight = (value / maxValue) * chartHeight;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col justify-end items-center" style={{ height: chartHeight }}>
                  <div className="text-xs font-medium text-foreground mb-1">
                    {value}
                  </div>
                  <div
                    className="w-full bg-linear-to-t from-primary to-secondary rounded-t-lg transition-all duration-500 hover:opacity-80"
                    style={{ height: `${barHeight}px` }}
                  />
                </div>
                <div className="text-xs text-foreground-muted font-medium">
                  {data.labels[index]}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-linear-to-t from-primary to-secondary"></div>
            <span className="text-foreground-muted">Revenu en €</span>
          </div>
        </div>
      </div>
    </div>
  );
}

