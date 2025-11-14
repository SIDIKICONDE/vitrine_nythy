/**
 * Page de gestion des commandes du marchand
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import { createAuthHeaders } from '@/lib/csrf-client';
import { useEffect, useState } from 'react';

// Types pour les commandes
interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'confirmed' | 'ready' | 'completed' | 'cancelled';
  pickupCode?: string | null;
  pickupTime: Date;
  createdAt: Date;
}

const statusConfig = {
  pending: {
    label: '⏳ En attente',
    color: 'bg-yellow-100 text-yellow-800',
  },
  confirmed: {
    label: '✅ Confirmée',
    color: 'bg-blue-100 text-blue-800',
  },
  ready: {
    label: '📦 Prête',
    color: 'bg-green-100 text-green-800',
  },
  completed: {
    label: '✔️ Terminée',
    color: 'bg-gray-100 text-gray-800',
  },
  cancelled: {
    label: '❌ Annulée',
    color: 'bg-red-100 text-red-800',
  },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'ready' | 'completed'>('all');

  useEffect(() => {
    // Récupérer le merchantId et les commandes depuis l'API
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Récupérer le merchantId de l'utilisateur connecté
        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          throw new Error(merchantResult.message || 'Erreur lors de la récupération du commerce');
        }

        const merchant = merchantResult.merchant;
        const currentMerchantId = merchant.id;
        setMerchantId(currentMerchantId);

        // Extraire les données du marchand pour le header
        setMerchantData({
          name: merchant.business_name || merchant.name || 'Commerce',
          email: merchant.email || merchant.contact_email || '',
          image: merchant.logo || merchant.logo_url || null,
        });

        // 2. Récupérer les commandes
        console.log('📡 [Page] Récupération commandes pour merchant:', currentMerchantId);
        const ordersResponse = await fetch(`/api/merchant/${currentMerchantId}/orders`);
        const ordersResult = await ordersResponse.json();

        console.log('📦 [Page] Réponse API:', {
          ok: ordersResponse.ok,
          success: ordersResult.success,
          ordersCount: ordersResult.orders?.length || 0,
          message: ordersResult.message,
        });

        if (!ordersResponse.ok || !ordersResult.success) {
          console.error('❌ [Page] Erreur API:', ordersResult);
          throw new Error(ordersResult.message || 'Erreur lors de la récupération des commandes');
        }

        // Normaliser les données des commandes
        const normalizedOrders = (ordersResult.orders || []).map((order: any) => {
          const normalized = {
            id: order.id,
            orderNumber: order.order_number || order.orderNumber || `#${order.id?.slice(0, 8) || 'N/A'}`,
            customerName: order.customer_name || order.customerName || 'Client inconnu',
            items: Array.isArray(order.items) ? order.items : [],
            total: order.total || order.totalAmount || 0,
            status: order.status || 'pending',
            pickupCode: order.pickupCode || order.pickup_code || null,
            pickupTime: order.pickup_time ? new Date(order.pickup_time) : (order.created_at ? new Date(order.created_at) : new Date()),
            createdAt: order.created_at ? new Date(order.created_at) : (order.createdAt ? new Date(order.createdAt) : new Date()),
          };
          console.log('✅ [Page] Commande normalisée:', {
            id: normalized.id,
            orderNumber: normalized.orderNumber,
            customerName: normalized.customerName,
            status: normalized.status,
            pickupCode: normalized.pickupCode,
            itemsCount: normalized.items.length,
            total: normalized.total,
          });
          return normalized;
        });

        console.log(`✅ [Page] ${normalizedOrders.length} commandes normalisées`);
        setOrders(normalizedOrders);
      } catch (err) {
        console.error('❌ [Page] Erreur lors du chargement:', err);
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des commandes';
        setError(errorMessage);
        // Afficher aussi dans la console pour déboguer
        console.error('Détails de l\'erreur:', {
          error: err,
          message: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    if (!merchantId) return;

    try {
      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch(`/api/merchant/${merchantId}/orders/${orderId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }

      // Mettre à jour le statut dans la liste locale
      setOrders(prev => prev.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du statut');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  const filteredOrders = orders.filter(order => {
    const status = String(order.status).toLowerCase();

    if (filter === 'all') return true;
    if (filter === 'pending') return status === 'pending' || status === 'confirmed';
    if (filter === 'ready') return status === 'ready' || status === 'ready_for_pickup';
    if (filter === 'completed') return status === 'completed' || status === 'cancelled' || status === 'picked_up';
    return true;
  });

  // Log pour déboguer si aucune commande après filtrage
  if (orders.length > 0 && filteredOrders.length === 0) {
    console.log('🔍 [Page] Filtrage commandes:', {
      filter,
      totalOrders: orders.length,
      orderStatuses: orders.map(o => o.status),
    });
  }

  // Utilisateur par défaut (fallback)
  const defaultUser = {
    name: 'Commerce',
    email: '',
    image: null,
  };

  const displayUser = merchantData || defaultUser;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <MerchantHeader user={displayUser} />

      <div className="flex">
        {/* Sidebar */}
        <MerchantSidebar />

        {/* Main Content */}
        <main className="flex-1 p-8 lg:pb-8 pb-24">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="font-medium">Erreur</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  Commandes
                </h1>
                <p className="text-foreground-muted mt-2">
                  Gérez les commandes de vos clients
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-foreground">{filteredOrders.length}</p>
                <p className="text-sm text-foreground-muted">
                  Commande{filteredOrders.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Filtres */}
            <div className="liquid-glass p-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${filter === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-surface-hover text-foreground-muted hover:bg-surface-active'
                    }
                  `}
                >
                  Toutes ({orders.length})
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${filter === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-surface-hover text-foreground-muted hover:bg-surface-active'
                    }
                  `}
                >
                  En cours ({orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length})
                </button>
                <button
                  onClick={() => setFilter('ready')}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${filter === 'ready'
                      ? 'bg-green-600 text-white'
                      : 'bg-surface-hover text-foreground-muted hover:bg-surface-active'
                    }
                  `}
                >
                  Prêtes ({orders.filter(o => o.status === 'ready').length})
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`
                    px-4 py-2 rounded-lg font-medium transition-colors
                    ${filter === 'completed'
                      ? 'bg-gray-600 text-white'
                      : 'bg-surface-hover text-foreground-muted hover:bg-surface-active'
                    }
                  `}
                >
                  Terminées ({orders.filter(o => o.status === 'completed' || o.status === 'cancelled').length})
                </button>
              </div>
            </div>

            {/* Liste des commandes */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="liquid-glass p-6 animate-pulse">
                    <div className="h-6 bg-surface-hover rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-surface-hover rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : orders.length > 0 && filteredOrders.length === 0 ? (
              <div className="text-center py-12 liquid-glass">
                <p className="text-lg text-foreground-muted mb-2">
                  Aucune commande ne correspond au filtre "{filter}"
                </p>
                <p className="text-sm text-foreground-subtle mb-4">
                  {orders.length} commande(s) trouvée(s) mais filtrée(s)
                </p>
                <button
                  onClick={() => setFilter('all')}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Voir toutes les commandes
                </button>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="space-y-2">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="liquid-glass hover:shadow-custom-md transition-all duration-200">
                    <div className="p-3 border-l-4 border-primary">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground">
                            {order.orderNumber}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[order.status].color}`}>
                            {statusConfig[order.status].label}
                          </span>
                          <span className="text-xs text-foreground-muted">
                            • {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <p className="text-lg font-bold text-primary">
                          {order.total.toFixed(2)}€
                        </p>
                      </div>

                      {/* Contenu compact */}
                      <div className="flex items-center justify-between gap-4 mb-2">
                        {/* Client + Articles */}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-foreground">
                            👤 <span className="font-medium">{order.customerName}</span>
                          </span>
                          <span className="text-foreground-muted">
                            🛒 {order.items.length} article{order.items.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Horaire de retrait */}
                        <div className="flex items-center gap-2 text-sm bg-primary/5 px-2 py-1 rounded">
                          <span className="text-foreground-muted">⏰</span>
                          <span className="font-medium text-foreground">{formatTime(order.pickupTime)}</span>
                        </div>
                      </div>

                      {/* Code de récupération */}
                      {order.pickupCode && (
                        <div className="mb-2 bg-linear-to-r from-blue-500/10 to-purple-500/10 border border-blue-300 rounded-lg p-2">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-xs font-medium text-foreground-muted">CODE DE RETRAIT:</span>
                            <span className="text-2xl font-bold tracking-wider text-primary font-mono">
                              {order.pickupCode}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1.5">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(order.id, 'confirmed')}
                              className="flex-1 bg-primary hover:bg-primary-dark text-white font-medium py-1 px-3 rounded text-xs transition-colors"
                            >
                              ✅ Confirmer
                            </button>
                            <button
                              onClick={() => handleStatusChange(order.id, 'cancelled')}
                              className="px-2 py-1 border border-red-300 text-red-600 hover:bg-red-50 font-medium rounded text-xs transition-colors"
                            >
                              ❌
                            </button>
                          </>
                        )}
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'ready')}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-1 px-3 rounded text-xs transition-colors"
                          >
                            📦 Prête
                          </button>
                        )}
                        {order.status === 'ready' && (
                          <button
                            onClick={() => handleStatusChange(order.id, 'completed')}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-1 px-3 rounded text-xs transition-colors"
                          >
                            ✔️ Récupérée
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 liquid-glass">
                <p className="text-lg text-foreground-muted mb-2">
                  Aucune commande trouvée
                </p>
                <p className="text-sm text-foreground-subtle">
                  Les nouvelles commandes apparaîtront ici
                </p>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

