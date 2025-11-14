/**
 * Page de création d'un nouveau produit
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import ProductForm from '@/app/merchant/products/ProductForm';
import { createAuthHeaders } from '@/lib/csrf-client';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function NewProductPage() {
  const router = useRouter();
  const [merchantId, setMerchantId] = React.useState<string | null>(null);
  const [merchantData, setMerchantData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Récupérer le merchantId et les données du marchand
    const fetchMerchant = async () => {
      try {
        const response = await fetch('/api/merchant/me');
        const result = await response.json();

        if (response.ok && result.success) {
          setMerchantId(result.merchant.id);

          // Extraire les données du marchand
          const merchant = result.merchant;
          setMerchantData({
            name: merchant.business_name || merchant.name || 'Commerce',
            email: merchant.email || merchant.contact_email || '',
            image: merchant.logo || merchant.logo_url || null,
          });
        } else {
          throw new Error('Commerce non trouvé');
        }
      } catch (error) {
        console.error('Erreur:', error);
        router.push('/merchant/login');
      } finally {
        setLoading(false);
      }
    };

    fetchMerchant();
  }, [router]);

  const handleSubmit = async (data: any) => {
    if (!merchantId) {
      throw new Error('Commerce non identifié');
    }

    try {
      console.log('🛍️ Création du produit:', data);

      // Préparer les données pour l'API
      const productData = {
        title: data.title,
        description: data.description,
        originalPrice: data.originalPrice,
        discountedPrice: data.discountedPrice,
        quantity: data.quantity,
        maxPerUser: data.maxPerUser || null,
        pickupStart: data.pickupStart,
        pickupEnd: data.pickupEnd,
        expiresAt: data.expirationDate,
        category: data.category,
        subcategory: data.subcategory || null,
        dietaryTags: data.dietaryTags || [],
        allergenTags: data.allergenTags || [],
        isSurpriseBox: data.isSurpriseBox || false,
        surpriseDescription: data.surpriseDescription || '',
        weightGrams: data.weightGrams || null,
        co2SavedGrams: data.co2SavedGrams || null,
        pickupInstructions: data.pickupInstructions || '',
        images: [], // TODO: Gérer l'upload d'images
      };

      console.log('📤 Envoi à l\'API:', productData);

      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch(`/api/merchant/${merchantId}/products`, {
        method: 'POST',
        headers,
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Erreur lors de la création du produit');
      }

      console.log('✅ Produit créé avec succès:', result.productId);

      // Rediriger vers la liste des produits
      router.push('/merchant/products');
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
      throw error;
    }
  };

  // Utilisateur par défaut (fallback)
  const defaultUser = {
    name: 'Commerce',
    email: '',
    image: null,
  };

  const displayUser = merchantData || defaultUser;

  if (loading || !merchantId) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-foreground-muted">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

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
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Nouveau produit anti-gaspillage
              </h1>
              <p className="text-foreground-muted mt-2">
                Créez un nouveau produit pour lutter contre le gaspillage alimentaire
              </p>
            </div>

            {/* Formulaire */}
            <ProductForm onSubmit={handleSubmit} />
          </div>
        </main>
      </div>
    </div>
  );
}

