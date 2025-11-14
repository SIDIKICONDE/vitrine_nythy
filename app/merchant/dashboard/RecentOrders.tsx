/**
 * RecentOrders - Commandes récentes
 */

'use client';

import apiDashboardRepository from '@/app/merchant/infrastructure/api/ApiDashboardRepository';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: number;
  total: number;
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  createdAt: Date | string;
}

const statusLabels = {
  pending: { label: '⏳ En attente', color: 'text-yellow-600 bg-yellow-50' },
  confirmed: { label: '✅ Confirmée', color: 'text-blue-600 bg-blue-50' },
  ready: { label: '📦 Prête', color: 'text-green-600 bg-green-50' },
  completed: { label: '✔️ Terminée', color: 'text-gray-600 bg-gray-50' },
  cancelled: { label: '❌ Annulée', color: 'text-red-600 bg-red-50' },
};

interface RecentOrdersProps {
  initialOrders?: any[];
}

export default function RecentOrders({ initialOrders }: RecentOrdersProps = {}) {
  const [orders, setOrders] = useState<Order[]>(
    initialOrders
      ? initialOrders.map(order => ({
        ...order,
        createdAt: order.createdAt
          ? (typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt)
          : new Date(), // Date par défaut si manquante
      }))
      : []
  );
  const [loading, setLoading] = useState(!initialOrders);

  useEffect(() => {
    // Si on a déjà les données initiales, ne pas refaire l'appel API
    if (initialOrders) {
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);

        // 1. Récupérer le merchantId
        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          throw new Error(merchantResult.message || 'Erreur lors de la récupération du commerce');
        }

        const merchantId = merchantResult.merchant.id;

        // 2. Récupérer les commandes récentes
        const apiOrders = await apiDashboardRepository.getRecentOrders(merchantId);

        // Convertir les dates string en Date avec gestion des valeurs manquantes
        const ordersWithDates = apiOrders.map(order => ({
          ...order,
          createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
        }));

        setOrders(ordersWithDates);
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [initialOrders]);

  const formatDate = (date: Date | string | null | undefined) => {
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
      console.error('Erreur formatage date:', error);
      return 'Date invalide';
    }
  };

  if (loading) {
    return (
      <div className="liquid-glass p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-hover rounded w-1/3"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-hover rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href="/merchant/orders"
        className="flex items-center justify-between group"
      >
        <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
          Commandes récentes
        </h2>
        <span className="text-sm text-primary hover:text-secondary transition-colors font-medium">
          Voir tout →
        </span>
      </Link>

      <div className="liquid-glass overflow-hidden">
        {orders.length > 0 ? (
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-foreground">
                        {order.orderNumber}
                      </span>
                      <span className="text-sm text-foreground-muted">
                        {order.customerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-foreground-muted">
                      <span>{order.items} article{order.items > 1 ? 's' : ''}</span>
                      <span className="font-bold text-foreground">
                        {order.total.toFixed(2)}€
                      </span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                  </div>
                  <div className={`
                    px-3 py-1 rounded-full text-xs font-medium
                    ${statusLabels[order.status].color}
                  `}>
                    {statusLabels[order.status].label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-lg text-foreground-muted">
              Aucune commande récente
            </p>
            <p className="text-sm text-foreground-subtle mt-2">
              Les nouvelles commandes apparaîtront ici
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

