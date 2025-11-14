/**
 * Page d'édition d'un produit
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import ProductForm from '@/app/merchant/products/ProductForm';
import { createAuthHeaders } from '@/lib/csrf-client';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  // Next.js 15: Unwrap params Promise
  const { id: productId } = use(params);
  
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Récupérer le merchantId, les données du marchand et le produit
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Récupérer le merchantId et les données
        console.log('🔍 Récupération du merchant...');
        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          throw new Error(merchantResult.message || 'Commerce non trouvé');
        }

        const currentMerchantId = merchantResult.merchant.id;
        setMerchantId(currentMerchantId);

        // Extraire les données du marchand
        const merchant = merchantResult.merchant;
        setMerchantData({
          name: merchant.business_name || merchant.name || 'Commerce',
          email: merchant.email || merchant.contact_email || '',
          image: merchant.logo || merchant.logo_url || null,
        });

        console.log('✅ Merchant ID:', currentMerchantId);

        // 2. Récupérer le produit
        console.log('📦 Récupération du produit:', productId);
        const productResponse = await fetch(`/api/merchant/${currentMerchantId}/products/${productId}`);
        const productResult = await productResponse.json();

        if (!productResponse.ok || !productResult.success) {
          throw new Error(productResult.message || 'Produit non trouvé');
        }

        // Normaliser les données pour le formulaire
        const productData = productResult.product;
        const normalizedProduct = {
          id: productData.id,
          title: productData.title,
          description: productData.description || '',
          category: productData.category || '',
          subcategory: productData.subcategory || null,
          originalPrice: productData.original_price ? productData.original_price.amountMinor / 100 : 0,
          discountedPrice: productData.discounted_price ? productData.discounted_price.amountMinor / 100 : 0,
          quantity: productData.quantity || 1,
          maxPerUser: productData.max_per_user || null,
          pickupStart: productData.pickup_start ? new Date(productData.pickup_start).toISOString().slice(0, 16) : '',
          pickupEnd: productData.pickup_end ? new Date(productData.pickup_end).toISOString().slice(0, 16) : '',
          expirationDate: productData.expires_at ? new Date(productData.expires_at).toISOString().slice(0, 16) : null,
          dietaryTags: productData.dietary_tags || [],
          allergenTags: productData.allergen_tags || [],
          isSurpriseBox: productData.is_surprise_box || false,
          surpriseDescription: productData.surprise_description || '',
          weightGrams: productData.weight_grams || null,
          co2SavedGrams: productData.co2_saved_grams || null,
          pickupInstructions: productData.pickup_instructions || '',
        };

        setProduct(normalizedProduct);
        console.log('✅ Produit chargé');
      } catch (err) {
        console.error('❌ Erreur:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const handleSubmit = async (data: any) => {
    if (!merchantId) {
      throw new Error('Commerce non identifié');
    }

    try {
      console.log('📝 Mise à jour du produit:', productId, data);

      // Préparer les données pour l'API
      const updateData = {
        title: data.title,
        description: data.description,
        original_price: data.originalPrice,
        discounted_price: data.discountedPrice,
        quantity: data.quantity,
        max_per_user: data.maxPerUser || null,
        pickup_start: data.pickupStart,
        pickup_end: data.pickupEnd,
        expires_at: data.expirationDate,
        category: data.category,
        subcategory: data.subcategory || null,
        dietary_tags: data.dietaryTags || [],
        allergen_tags: data.allergenTags || [],
        is_surprise_box: data.isSurpriseBox || false,
        surprise_description: data.surpriseDescription || '',
        weight_grams: data.weightGrams || null,
        co2_saved_grams: data.co2SavedGrams || null,
        pickup_instructions: data.pickupInstructions || '',
      };

      console.log('📤 Envoi à l\'API:', updateData);

      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch(`/api/merchant/${merchantId}/products/${productId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors de la mise à jour');
      }

      console.log('✅ Produit mis à jour avec succès');

      // Rediriger vers la liste des produits
      router.push('/merchant/products');
    } catch (err) {
      console.error('❌ Erreur lors de la mise à jour:', err);
      throw err;
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
              <div className="space-y-6">
                <div className="h-12 bg-surface-hover rounded animate-pulse"></div>
                <div className="h-96 bg-surface-hover rounded animate-pulse"></div>
              </div>
            ) : !product ? (
              <div className="text-center py-12">
                <p className="text-lg text-foreground-muted">
                  Produit introuvable
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Page Header */}
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    Modifier le produit
                  </h1>
                  <p className="text-foreground-muted mt-2">
                    Mettez à jour les informations de votre produit
                  </p>
                </div>

                {/* Formulaire */}
                <ProductForm
                  initialData={product}
                  onSubmit={handleSubmit}
                  isEditing={true}
                />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

