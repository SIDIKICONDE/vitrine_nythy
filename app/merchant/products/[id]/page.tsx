/**
 * Page de détails d'un produit
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import { createAuthHeaders } from '@/lib/csrf-client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

interface ProductDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  // Next.js 15: Unwrap params Promise
  const { id: productId } = use(params);

  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Récupérer le merchantId
        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          throw new Error(merchantResult.message || 'Commerce non trouvé');
        }

        const currentMerchantId = merchantResult.merchant.id;
        setMerchantId(currentMerchantId);

        const merchant = merchantResult.merchant;
        console.log('🔍 Merchant data:', merchant);
        const bannerUrl = merchant.bannerUrl || merchant.banner_url || null;
        console.log('🖼️ Banner URL:', bannerUrl);
        setMerchantData({
          name: merchant.business_name || merchant.name || 'Commerce',
          email: merchant.email || merchant.contact_email || '',
          image: merchant.logo || merchant.logo_url || null,
          bannerUrl: bannerUrl,
        });

        // 2. Récupérer le produit
        const productResponse = await fetch(`/api/merchant/${currentMerchantId}/products/${productId}`);
        const productResult = await productResponse.json();

        if (!productResponse.ok || !productResult.success) {
          throw new Error(productResult.message || 'Produit non trouvé');
        }

        setProduct(productResult.product);
      } catch (err) {
        console.error('❌ Erreur:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  const handleDelete = async () => {
    if (!merchantId || !confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

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

      router.push('/merchant/products');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const formatPrice = (price: any) => {
    if (!price?.amountMinor) return '0.00€';
    return `${(price.amountMinor / 100).toFixed(2)}€`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Non défini';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const defaultUser = {
    name: 'Commerce',
    email: '',
    image: null,
  };

  const displayUser = merchantData || defaultUser;

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="h-12 bg-surface-hover rounded animate-pulse"></div>
              <div className="h-96 bg-surface-hover rounded animate-pulse"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8">
            <div className="max-w-5xl mx-auto">
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                <p className="font-medium">Erreur</p>
                <p className="text-sm">{error || 'Produit introuvable'}</p>
              </div>
              <Link
                href="/merchant/products"
                className="inline-block mt-4 text-primary hover:underline"
              >
                ← Retour aux produits
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const discountPercentage = product.original_price?.amountMinor && product.discounted_price?.amountMinor
    ? Math.round(((product.original_price.amountMinor - product.discounted_price.amountMinor) / product.original_price.amountMinor) * 100)
    : 0;

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; color: string }> = {
      available: { label: 'Disponible', color: 'bg-green-100 text-green-800' },
      'sold-out': { label: 'Épuisé', color: 'bg-gray-100 text-gray-800' },
      scheduled: { label: 'Programmé', color: 'bg-blue-100 text-blue-800' },
      archived: { label: 'Archivé', color: 'bg-orange-100 text-orange-800' },
      expired: { label: 'Expiré', color: 'bg-red-100 text-red-800' },
    };
    const badge = badges[status] ?? badges['available']!;
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-surface">
      <MerchantHeader user={displayUser} />

      <div className="flex">
        <MerchantSidebar />

        <main className="flex-1 p-8 lg:pb-8 pb-24">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header avec actions */}
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/merchant/products"
                  className="text-primary hover:underline mb-2 inline-block"
                >
                  ← Retour aux produits
                </Link>
                <h1 className="text-3xl font-bold text-foreground">
                  Détails du produit
                </h1>
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/merchant/products/${productId}/edit`}
                  className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  ✏️ Modifier
                </Link>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>

            {/* Banner du marchand */}
            {merchantData?.bannerUrl && (
              <div className="liquid-glass p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">🏪 Commerce</h2>
                <div className="relative h-48 rounded-xl overflow-hidden">
                  <Image
                    src={merchantData.bannerUrl}
                    alt={merchantData.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  {/* Logo du marchand */}
                  {merchantData.image && (
                    <div className="absolute bottom-4 left-4 w-16 h-16 bg-white rounded-full shadow-lg overflow-hidden border-4 border-white">
                      <Image
                        src={merchantData.image}
                        alt={merchantData.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
                <p className="mt-3 text-lg font-bold text-foreground">{merchantData.name}</p>
              </div>
            )}

            {/* Contenu principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Images - Ne s'affiche que s'il y a des images */}
              {product.images && product.images.length > 0 && (
                <div className="liquid-glass p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">Images</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {product.images.map((img: any, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-surface">
                        <Image
                          src={img.url}
                          alt={img.alt || product.title}
                          fill
                          sizes="(max-width: 1024px) 50vw, 25vw"
                          className="object-cover"
                        />
                        {img.is_primary && (
                          <span className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Informations principales */}
              <div className={`liquid-glass p-6 space-y-4 ${!product.images || product.images.length === 0 ? 'lg:col-span-2' : ''}`}>
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-2xl font-bold text-foreground">{product.title}</h2>
                    {getStatusBadge(product.status)}
                  </div>
                  {product.sku && (
                    <p className="text-sm text-foreground-muted">SKU: {product.sku}</p>
                  )}
                </div>

                {product.description && (
                  <p className="text-foreground">{product.description}</p>
                )}

                {/* Prix */}
                <div className="border-t border-b border-border py-4">
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-primary">
                      {formatPrice(product.discounted_price)}
                    </span>
                    <span className="text-xl text-foreground-muted line-through">
                      {formatPrice(product.original_price)}
                    </span>
                    <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded">
                      -{discountPercentage}%
                    </span>
                  </div>
                </div>

                {/* Stock & Catégorie */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Quantité disponible</p>
                    <p className="text-lg font-bold text-foreground">{product.quantity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Catégorie</p>
                    <p className="text-lg font-medium text-foreground capitalize">
                      {product.category || 'Non défini'}
                    </p>
                  </div>
                </div>

                {product.max_per_user && (
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Limite par utilisateur</p>
                    <p className="text-lg font-medium text-foreground">{product.max_per_user}</p>
                  </div>
                )}

                {product.is_surprise_box && (
                  <div className="bg-primary/10 border border-primary rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🎁</span>
                      <span className="font-bold text-primary">Panier Surprise</span>
                    </div>
                    {product.surprise_description && (
                      <p className="text-sm text-foreground-muted">{product.surprise_description}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dates et horaires */}
            <div className="liquid-glass p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">📅 Dates et horaires</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Retrait début</p>
                  <p className="text-foreground font-medium">{formatDate(product.pickup_start)}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Retrait fin</p>
                  <p className="text-foreground font-medium">{formatDate(product.pickup_end)}</p>
                </div>
                <div>
                  <p className="text-sm text-foreground-muted mb-1">Date d'expiration</p>
                  <p className="text-foreground font-medium">{formatDate(product.expires_at)}</p>
                </div>
              </div>
              {product.pickup_instructions && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-foreground-muted mb-2">Instructions de retrait</p>
                  <p className="text-foreground">{product.pickup_instructions}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            {(product.dietary_tags?.length > 0 || product.allergen_tags?.length > 0) && (
              <div className="liquid-glass p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">🏷️ Tags</h2>
                <div className="space-y-3">
                  {product.dietary_tags?.length > 0 && (
                    <div>
                      <p className="text-sm text-foreground-muted mb-2">Régimes alimentaires</p>
                      <div className="flex flex-wrap gap-2">
                        {product.dietary_tags.map((tag: string) => (
                          <span key={tag} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.allergen_tags?.length > 0 && (
                    <div>
                      <p className="text-sm text-foreground-muted mb-2">Allergènes</p>
                      <div className="flex flex-wrap gap-2">
                        {product.allergen_tags.map((tag: string) => (
                          <span key={tag} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Impact environnemental */}
            {(product.weight_grams || product.co2_saved_grams) && (
              <div className="liquid-glass p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">🌱 Impact environnemental</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.weight_grams && (
                    <div>
                      <p className="text-sm text-foreground-muted mb-1">Poids</p>
                      <p className="text-lg font-medium text-foreground">
                        {product.weight_grams >= 1000
                          ? `${(product.weight_grams / 1000).toFixed(1)}kg`
                          : `${product.weight_grams}g`}
                      </p>
                    </div>
                  )}
                  {product.co2_saved_grams && (
                    <div>
                      <p className="text-sm text-foreground-muted mb-1">CO₂ économisé</p>
                      <p className="text-lg font-medium text-green-600">
                        {product.co2_saved_grams >= 1000
                          ? `${(product.co2_saved_grams / 1000).toFixed(1)}kg`
                          : `${product.co2_saved_grams}g`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

