/**
 * TopProducts - Produits les plus vendus
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import apiDashboardRepository from '@/app/merchant/infrastructure/api/ApiDashboardRepository';

interface TopProduct {
  id: string;
  title: string;
  imageUrl?: string;
  sales: number;
  revenue: number;
  rating: number;
}

interface TopProductsProps {
  initialProducts?: TopProduct[];
}

export default function TopProducts({ initialProducts }: TopProductsProps = {}) {
  const [products, setProducts] = useState<TopProduct[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);

  useEffect(() => {
    // Si on a déjà les données initiales, ne pas refaire l'appel API
    if (initialProducts) {
      return;
    }

    const fetchTopProducts = async () => {
      try {
        setLoading(true);

        // 1. Récupérer le merchantId
        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          throw new Error(merchantResult.message || 'Erreur lors de la récupération du commerce');
        }

        const merchantId = merchantResult.merchant.id;

        // 2. Récupérer les top produits
        const apiProducts = await apiDashboardRepository.getTopProducts(merchantId);
        setProducts(apiProducts);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, [initialProducts]);

  if (loading) {
    return (
      <div className="liquid-glass p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-surface-hover rounded w-1/3"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 bg-surface-hover rounded"></div>
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Top 5 des produits
        </h2>
        <Link
          href="/merchant/products"
          className="text-sm text-primary hover:text-secondary transition-colors font-medium"
        >
          Voir tout →
        </Link>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <Link
            key={product.id}
            href={`/merchant/products/${product.id}`}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-surface-hover transition-colors group"
          >
            {/* Rang */}
            <div className="shrink-0 w-8 h-8 rounded-full bg-linear-to-br from-primary to-secondary text-white font-bold flex items-center justify-center text-sm">
              {index + 1}
            </div>

            {/* Image */}
            <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-surface-hover">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  🍽️
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                {product.title}
              </p>
              <div className="flex items-center gap-3 text-xs text-foreground-muted mt-1">
                <span>📦 {product.sales} ventes</span>
                <span>⭐ {product.rating.toFixed(1)}</span>
              </div>
            </div>

            {/* Revenue */}
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-foreground">
                {product.revenue.toFixed(2)}€
              </p>
              <p className="text-xs text-foreground-muted">
                CA généré
              </p>
            </div>
          </Link>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-8">
          <p className="text-foreground-muted">
            Aucune vente pour le moment
          </p>
        </div>
      )}
    </div>
  );
}

