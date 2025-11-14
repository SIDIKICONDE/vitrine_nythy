'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface NotificationCounts {
  orders: number;      // Commandes en attente (pending)
  reviews: number;     // Avis sans réponse
  products: number;    // Produits en rupture de stock
}

// Clés pour le localStorage
const LAST_VISIT_KEYS = {
  orders: 'merchant_last_visit_orders',
  reviews: 'merchant_last_visit_reviews',
  products: 'merchant_last_visit_products',
};

/**
 * Hook pour récupérer les notifications réelles du marchand
 * - Commandes en attente
 * - Avis sans réponse
 * - Produits en rupture de stock
 */
export function useNotifications() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<NotificationCounts>({
    orders: 0,
    reviews: 0,
    products: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Marquer la page actuelle comme visitée
  useEffect(() => {
    const markAsVisited = () => {
      const now = Date.now();
      if (pathname.includes('/merchant/orders')) {
        localStorage.setItem(LAST_VISIT_KEYS.orders, now.toString());
        // Réinitialiser le compteur pour cette page
        setNotifications(prev => ({ ...prev, orders: 0 }));
      } else if (pathname.includes('/merchant/reviews')) {
        localStorage.setItem(LAST_VISIT_KEYS.reviews, now.toString());
        setNotifications(prev => ({ ...prev, reviews: 0 }));
      } else if (pathname.includes('/merchant/products')) {
        localStorage.setItem(LAST_VISIT_KEYS.products, now.toString());
        setNotifications(prev => ({ ...prev, products: 0 }));
      }
    };

    markAsVisited();
  }, [pathname]);

  // Charger les notifications réelles
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        // 1. Récupérer le merchantId
        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          setIsLoading(false);
          return; // Pas de merchant, pas de notifications
        }

        const merchantId = merchantResult.merchant.id;

        // Récupérer les timestamps de dernière visite
        const lastVisitOrders = parseInt(localStorage.getItem(LAST_VISIT_KEYS.orders) || '0');
        const lastVisitReviews = parseInt(localStorage.getItem(LAST_VISIT_KEYS.reviews) || '0');
        const lastVisitProducts = parseInt(localStorage.getItem(LAST_VISIT_KEYS.products) || '0');

        // 2. Récupérer les commandes en attente
        const ordersResponse = await fetch(`/api/merchant/${merchantId}/orders`);
        if (ordersResponse.ok) {
          const ordersResult = await ordersResponse.json();
          if (ordersResult.success) {
            const newOrders = ordersResult.orders.filter((order: any) => {
              const isPending = order.status === 'pending' || order.status === 'confirmed';
              if (!isPending) return false;

              // Vérifier si la commande est plus récente que la dernière visite
              const orderDate = order.createdAt?._seconds
                ? order.createdAt._seconds * 1000
                : new Date(order.createdAt).getTime();
              return orderDate > lastVisitOrders;
            });
            setNotifications(prev => ({ ...prev, orders: newOrders.length }));
          }
        }

        // 3. Récupérer les avis sans réponse
        const reviewsResponse = await fetch(`/api/merchant/${merchantId}/reviews`);
        if (reviewsResponse.ok) {
          const reviewsResult = await reviewsResponse.json();
          if (reviewsResult.success) {
            const newReviews = reviewsResult.reviews.filter((review: any) => {
              const hasNoResponse = !review.merchant_response && !review.merchantResponse;
              if (!hasNoResponse) return false;

              // Vérifier si l'avis est plus récent que la dernière visite
              const reviewDate = review.createdAt?._seconds
                ? review.createdAt._seconds * 1000
                : new Date(review.createdAt).getTime();
              return reviewDate > lastVisitReviews;
            });
            setNotifications(prev => ({ ...prev, reviews: newReviews.length }));
          }
        }

        // 4. Récupérer les produits en rupture de stock
        const productsResponse = await fetch(`/api/merchant/${merchantId}/products`);
        if (productsResponse.ok) {
          const productsResult = await productsResponse.json();
          if (productsResult.success) {
            const newProducts = productsResult.products.filter((product: any) => {
              const isOutOfStock = product.stock === 0 || product.stock < 0;
              if (!isOutOfStock) return false;

              // Vérifier si le produit est devenu en rupture récemment
              const stockUpdatedAt = product.stock_updated_at?._seconds
                ? product.stock_updated_at._seconds * 1000
                : product.updated_at?._seconds
                ? product.updated_at._seconds * 1000
                : new Date(product.updated_at || product.createdAt).getTime();
              return stockUpdatedAt > lastVisitProducts;
            });
            setNotifications(prev => ({ ...prev, products: newProducts.length }));
          }
        }
      } catch (error) {
        console.error('Erreur chargement notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();

    // Recharger toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [pathname]); // Recharger quand on change de page

  // Calculer le total
  const totalCount = notifications.orders + notifications.reviews + notifications.products;

  return {
    notifications,
    totalCount,
    isLoading,
  };
}

