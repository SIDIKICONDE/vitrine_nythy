'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { SecurityEvent } from '@/types/admin';
import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';

/**
 * Page de monitoring de la sécurité
 */
export default function AdminMonitoringPage(): ReactElement {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/security/events');
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Erreur chargement événements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Monitoring Sécurité
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Surveillance des événements de sécurité
          </p>
        </div>

        {/* Liste des événements */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {events.map((event) => {
              const Icon =
                event.severity === 'critical' ? XCircle :
                  event.severity === 'high' ? AlertTriangle :
                    event.severity === 'medium' ? Activity :
                      CheckCircle;

              const colorClasses =
                event.severity === 'critical' ? 'border-red-300 dark:border-red-700' :
                  event.severity === 'high' ? 'border-orange-300 dark:border-orange-700' :
                    event.severity === 'medium' ? 'border-yellow-300 dark:border-yellow-700' :
                      'border-green-300 dark:border-green-700';

              return (
                <div
                  key={event.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl border-2 p-6 ${colorClasses}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {event.description}
                          </h3>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {event.userEmail} • {event.ipAddress}
                          </div>
                        </div>
                        <span
                          className={`
                            px-3 py-1 rounded-full text-xs font-bold
                            ${event.severity === 'critical' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}
                            ${event.severity === 'high' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' : ''}
                            ${event.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                            ${event.severity === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
                          `}
                        >
                          {event.severity.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(event.timestamp).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {events.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                Aucun événement de sécurité
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

