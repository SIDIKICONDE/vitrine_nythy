/**
 * Page de liste des produits du marchand
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import ProductsSkeleton from '@/app/merchant/components/skeletons/ProductsSkeleton';
import ProductFilters from '@/app/merchant/products/ProductFilters';
import ProductList from '@/app/merchant/products/ProductList';
import { createAuthHeaders } from '@/lib/csrf-client';
import { useEffect, useMemo, useState } from 'react';

export default function MerchantProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // États des filtres (alignés sur Flutter)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  useEffect(() => {
    // Récupérer le merchantId, les données du marchand et les produits
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Récupérer le merchantId et les données du marchand
        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          throw new Error(merchantResult.message || 'Erreur lors de la récupération du commerce');
        }

        const currentMerchantId = merchantResult.merchant.id;
        setMerchantId(currentMerchantId);

        // Extraire les données du marchand
        const merchant = merchantResult.merchant;
        setMerchantData({
          name: merchant.business_name || merchant.name || 'Commerce',
          email: merchant.email || merchant.contact_email || '',
          image: merchant.logo || merchant.logo_url || null,
          bannerUrl: merchant.bannerUrl || merchant.banner_url || null,
        });

        // 2. Récupérer les produits
        const productsResponse = await fetch(`/api/merchant/${currentMerchantId}/products`);
        const productsResult = await productsResponse.json();

        if (!productsResponse.ok || !productsResult.success) {
          throw new Error(productsResult.message || 'Erreur lors de la récupération des produits');
        }

        // Normaliser les données des produits
        const normalizedProducts = productsResult.products.map((product: any) => {
          // Extraire les valeurs d'impact environnemental
          const co2SavedGrams = product.co2_saved_grams;
          const weightGrams = product.weight_grams;

          console.log(`📊 [Produit ${product.title}] CO2: ${co2SavedGrams}g, Poids: ${weightGrams}g`);

          return {
            id: product.id,
            merchantId: product.merchantId,
            title: product.title,
            description: product.description || '',
            category: product.category,
            originalPrice: product.original_price || { amountMinor: 0, currencyCode: 'EUR' },
            discountedPrice: product.discounted_price || { amountMinor: 0, currencyCode: 'EUR' },
            quantity: product.quantity || 0,
            pickupStart: product.pickup_start ? new Date(product.pickup_start) : new Date(),
            pickupEnd: product.pickup_end ? new Date(product.pickup_end) : new Date(),
            imageUrls: product.images?.map((img: any) => img.url) || [],
            isSurpriseBox: product.is_surprise_box || false,
            dietaryTags: product.dietary_tags || [],
            status: product.status || 'available',
            // Garder null si non défini (ne pas remplacer par 0)
            co2SavedGrams: co2SavedGrams,
            weightGrams: weightGrams,
          };
        });

        setProducts(normalizedProducts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Extraire les catégories uniques des produits
  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    products.forEach((product: any) => {
      if (product.category) {
        uniqueCategories.add(product.category);
      }
    });
    return Array.from(uniqueCategories).sort();
  }, [products]);

  // Filtrer les produits selon les critères (aligné sur Flutter)
  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      // Filtre par recherche textuelle
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = product.title?.toLowerCase().includes(query);
        const matchesDescription = product.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription) return false;
      }

      // Filtre par catégorie
      if (selectedCategory && product.category !== selectedCategory) {
        return false;
      }

      // Filtre actifs seulement
      if (showActiveOnly && product.status !== 'available') {
        return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, showActiveOnly]);

  const handleDelete = async (productId: string) => {
    if (!merchantId) return;

    try {
      const headers = await createAuthHeaders();

      const response = await fetch(`/api/merchant/${merchantId}/products/${productId}`, {
        method: 'DELETE',
        headers,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors de la suppression');
      }

      // Retirer le produit de la liste
      setProducts(prev => prev.filter((p: any) => p.id !== productId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const handleToggleStatus = async (productId: string, isActive: boolean) => {
    if (!merchantId) return;

    try {
      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch(`/api/merchant/${merchantId}/products/${productId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status: isActive ? 'available' : 'sold-out',
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }

      // Mettre à jour le statut dans la liste
      setProducts(prev => prev.map((p: any) =>
        p.id === productId
          ? { ...p, status: isActive ? 'available' : 'sold-out' }
          : p
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

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
          <div className="max-w-7xl mx-auto">
            {/* Message d'erreur */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <p className="font-medium">Erreur</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {loading ? (
              <ProductsSkeleton />
            ) : (
              <>
                {/* Filtres de produits (alignés sur Flutter) */}
                {products.length > 0 && (
                  <ProductFilters
                    searchQuery={searchQuery}
                    selectedCategory={selectedCategory}
                    showActiveOnly={showActiveOnly}
                    categories={categories}
                    onSearchChanged={setSearchQuery}
                    onCategoryChanged={setSelectedCategory}
                    onActiveOnlyToggled={() => setShowActiveOnly(!showActiveOnly)}
                  />
                )}

                <ProductList
                  products={filteredProducts}
                  merchantBannerUrl={merchantData?.bannerUrl}
                  merchantLogoUrl={merchantData?.image}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

