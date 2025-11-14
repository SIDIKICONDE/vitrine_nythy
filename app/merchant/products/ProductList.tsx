/**
 * ProductList - Liste des produits du marchand
 */

'use client';

import Link from 'next/link';
import ProductCard from '../ProductCard';

interface Product {
  id: string;
  merchantId: string;
  title: string;
  description?: string;
  originalPrice: { amountMinor: number; currencyCode: string };
  discountedPrice: { amountMinor: number; currencyCode: string };
  quantity: number;
  pickupStart: Date;
  pickupEnd: Date;
  imageUrls: string[];
  isSurpriseBox: boolean;
  dietaryTags?: string[];
  status: string;
  weightGrams?: number;
  co2SavedGrams?: number;
}

interface ProductListProps {
  products: Product[];
  merchantBannerUrl?: string;
  merchantLogoUrl?: string;
  onDelete?: (productId: string) => Promise<void>;
  onToggleStatus?: (productId: string, isActive: boolean) => Promise<void>;
}

export default function ProductList({ products, merchantBannerUrl, merchantLogoUrl, onDelete, onToggleStatus }: ProductListProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Mes produits
          </h1>
          <p className="text-foreground-muted mt-1">
            {products.length} produit{products.length > 1 ? 's' : ''}
          </p>
        </div>

        <Link
          href="/merchant/products/new"
          className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors"
        >
          ➕ Nouveau produit
        </Link>
      </div>

      {/* Liste des produits */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="relative group">
              <ProductCard
                product={product}
                merchantBannerUrl={merchantBannerUrl}
                merchantLogoUrl={merchantLogoUrl}
              />

              {/* Actions overlay */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Link
                  href={`/merchant/products/${product.id}/edit`}
                  className="bg-primary text-white p-2 rounded-lg shadow-lg hover:bg-primary-dark transition-colors"
                  title="Modifier"
                >
                  ✏️
                </Link>

                {onToggleStatus && (
                  <button
                    onClick={() => onToggleStatus(product.id, product.status !== 'available')}
                    className="bg-secondary text-white p-2 rounded-lg shadow-lg hover:bg-secondary-dark transition-colors"
                    title={product.status === 'available' ? 'Désactiver' : 'Activer'}
                  >
                    {product.status === 'available' ? '👁️' : '🚫'}
                  </button>
                )}

                {onDelete && (
                  <button
                    onClick={() => {
                      if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
                        onDelete(product.id);
                      }
                    }}
                    className="bg-red-600 text-white p-2 rounded-lg shadow-lg hover:bg-red-700 transition-colors"
                    title="Supprimer"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 liquid-glass">
          <p className="text-lg text-foreground-muted mb-2">
            Aucun produit trouvé
          </p>
          <p className="text-sm text-foreground-subtle mb-4">
            Essayez de modifier vos filtres ou créez un nouveau produit
          </p>
          <Link
            href="/merchant/products/new"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            ➕ Créer mon premier produit
          </Link>
        </div>
      )}
    </div>
  );
}

