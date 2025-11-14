/**
 * ActivityFeed - Flux d'activité récente
 */

'use client';

import apiDashboardRepository from '@/app/merchant/infrastructure/api/ApiDashboardRepository';
import { useEffect, useState } from 'react';

interface Activity {
  id: string;
  type: 'order' | 'review' | 'follower' | 'product';
  icon: string;
  title: string;
  description: string;
  timestamp: Date | string;
}

interface ActivityFeedProps {
  initialActivities?: any[];
}

export default function ActivityFeed({ initialActivities }: ActivityFeedProps = {}) {
  const [activities, setActivities] = useState<Activity[]>(
    initialActivities
      ? initialActivities.map(activity => ({
        ...activity,
        timestamp: activity.timestamp
          ? (typeof activity.timestamp === 'string' ? new Date(activity.timestamp) : activity.timestamp)
          : new Date(), // Date par défaut si manquante
      }))
      : []
  );
  const [loading, setLoading] = useState(!initialActivities);

  useEffect(() => {
    // Si on a déjà les données initiales, ne pas refaire l'appel API
    if (initialActivities) {
      return;
    }

    const fetchActivities = async () => {
      try {
        setLoading(true);

        // 1. Récupérer le merchantId
        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          throw new Error(merchantResult.message || 'Erreur lors de la récupération du commerce');
        }

        const merchantId = merchantResult.merchant.id;

        // 2. Récupérer les activités
        const apiActivities = await apiDashboardRepository.getActivities(merchantId);

        // Filtrer et convertir les activités valides
        const activitiesWithDates: Activity[] = apiActivities
          .filter((activity): activity is typeof activity & { type: Activity['type'] } => {
            // Valider que le type est bien l'un des types attendus
            return ['order', 'review', 'follower', 'product'].includes(activity.type);
          })
          .map(activity => ({
            ...activity,
            type: activity.type as Activity['type'],
            timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
          }));

        setActivities(activitiesWithDates);
      } catch (error) {
        console.error('Erreur lors du chargement des activités:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [initialActivities]);

  const formatTimestamp = (date: Date | string | null | undefined) => {
    // Vérifier si la date existe
    if (!date) {
      return 'Date inconnue';
    }

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Vérifier si la date est valide
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Date invalide';
      }

      const now = new Date();
      const diff = now.getTime() - dateObj.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (minutes < 1) return `À l'instant`;
      if (minutes < 60) return `Il y a ${minutes} min`;
      if (hours < 24) return `Il y a ${hours}h`;
      return `Il y a ${days}j`;
    } catch (error) {
      console.error('Erreur formatage timestamp:', error);
      return 'Date invalide';
    }
  };

  if (loading) {
    return (
      <div className="liquid-glass p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-hover rounded w-1/3"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 bg-surface-hover rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-hover rounded w-3/4"></div>
                <div className="h-3 bg-surface-hover rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-glass p-6">
      <h2 className="text-xl font-bold text-foreground mb-6">
        Activité récente
      </h2>

      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex gap-4 items-start">
            <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
              {activity.icon}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {activity.title}
              </p>
              <p className="text-sm text-foreground-muted">
                {activity.description}
              </p>
              <p className="text-xs text-foreground-subtle mt-1">
                {formatTimestamp(activity.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-foreground-muted">
            Aucune activité récente
          </p>
        </div>
      )}
    </div>
  );
}

