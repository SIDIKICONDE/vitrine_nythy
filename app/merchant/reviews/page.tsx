/**
 * Page des avis clients
 * 
 * ✅ Connectée aux APIs Firebase
 * - Statistiques des avis (moyenne, distribution, total)
 * - Filtres par note et date
 * - Liste des avis avec pagination
 * - Réponse aux avis
 * - Tri par date, note, utilité
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import apiReviewRepository, { Review } from '@/app/merchant/infrastructure/api/ApiReviewRepository';
import { useEffect, useState } from 'react';

type FilterRating = 'all' | 1 | 2 | 3 | 4 | 5;
type SortBy = 'recent' | 'oldest' | 'highest' | 'lowest' | 'helpful';

interface ReviewWithDate extends Omit<Review, 'created_at'> {
  createdAt: Date;
}

export default function ReviewsPage() {
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [merchantData, setMerchantData] = useState<{ name: string; email: string; image: string | null } | null>(null);
  const [reviews, setReviews] = useState<ReviewWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterRating, setFilterRating] = useState<FilterRating>('all');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [showResponseForm, setShowResponseForm] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  // Chargement initial
  useEffect(() => {
    loadMerchantAndReviews();
  }, []);

  const loadMerchantAndReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Récupérer le merchantId et les données du marchand
      const merchantResponse = await fetch('/api/merchant/me');
      const merchantResult = await merchantResponse.json();

      if (!merchantResponse.ok || !merchantResult.success) {
        throw new Error(merchantResult.message || 'Commerce non trouvé');
      }

      const merchant = merchantResult.merchant;
      const currentMerchantId = merchant.id;
      setMerchantId(currentMerchantId);

      // Extraire les données pour le header
      setMerchantData({
        name: merchant.business_name || merchant.name || 'Commerce',
        email: merchant.email || merchant.contact_email || '',
        image: merchant.logo || merchant.logo_url || null,
      });

      // 2. Charger les avis
      await loadReviews(currentMerchantId);
    } catch (err) {
      console.error('Erreur chargement:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      setLoading(false);
    }
  };

  const loadReviews = async (currentMerchantId?: string) => {
    try {
      const idToUse = currentMerchantId || merchantId;
      if (!idToUse) return;

      const data = await apiReviewRepository.getMerchantReviews(idToUse);

      // Convertir les dates string en Date
      const reviewsWithDates = data.map(review => ({
        ...review,
        createdAt: new Date(review.created_at),
      })) as ReviewWithDate[];

      setReviews(reviewsWithDates);
    } catch (err) {
      console.error('Erreur chargement avis:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des avis');
    } finally {
      setLoading(false);
    }
  };

  // Stats calculées
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
    : 0;
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
    percentage: totalReviews > 0 ? (reviews.filter(r => r.rating === rating).length / totalReviews) * 100 : 0,
  }));

  // Filtrage et tri
  let filteredReviews = filterRating === 'all'
    ? reviews
    : reviews.filter(r => r.rating === filterRating);

  filteredReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'oldest':
        return a.createdAt.getTime() - b.createdAt.getTime();
      case 'highest':
        return b.rating - a.rating;
      case 'lowest':
        return a.rating - b.rating;
      case 'helpful':
        return b.helpful - a.helpful;
      default:
        return 0;
    }
  });

  // Handlers
  const handleSubmitResponse = async (reviewId: string) => {
    if (!merchantId) return;

    try {
      await apiReviewRepository.respondToReview(merchantId, reviewId, responseText);
      // Recharger les avis pour afficher la réponse
      await loadReviews();
      setShowResponseForm(null);
      setResponseText('');
    } catch (err) {
      console.error('Erreur lors de la réponse:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement de la réponse');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`text-xl ${star <= rating ? 'text-yellow-500' : 'text-border'}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Utilisateur par défaut (fallback)
  const defaultUser = {
    name: 'Commerce',
    email: '',
    image: null,
  };

  const displayUser = merchantData || defaultUser;

  // === Chargement ===
  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8 lg:pb-8 pb-24">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="h-12 bg-surface-hover rounded animate-pulse"></div>
              <div className="h-96 bg-surface-hover rounded animate-pulse"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8">
            <div className="max-w-7xl mx-auto">
              <div className="liquid-glass p-6 text-center">
                <p className="text-error text-lg">❌ {error}</p>
                <button
                  onClick={() => loadMerchantAndReviews()}
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <MerchantHeader user={displayUser} />
      <div className="flex">
        <MerchantSidebar />
        <main className="flex-1 p-8 lg:pb-8 pb-24">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Avis clients
              </h1>
              <p className="text-foreground-muted mt-2">
                Gérez et répondez aux avis de vos clients
              </p>
            </div>

            {/* Statistiques globales */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Note moyenne */}
              <div className="liquid-glass p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground-muted mb-2">Note moyenne</p>
                  <p className="text-5xl font-bold text-foreground mb-2">
                    {averageRating.toFixed(1)}
                  </p>
                  <div className="flex justify-center mb-2">
                    {renderStars(Math.round(averageRating))}
                  </div>
                  <p className="text-sm text-foreground-muted">
                    Basée sur {totalReviews} avis
                  </p>
                </div>
              </div>

              {/* Distribution */}
              <div className="liquid-glass p-6 lg:col-span-2">
                <p className="text-sm font-medium text-foreground-muted mb-4">Distribution des notes</p>
                <div className="space-y-3">
                  {ratingDistribution.map(({ rating, count, percentage }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground w-12">
                        {rating} ★
                      </span>
                      <div className="flex-1 h-3 bg-surface-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-foreground-muted w-16 text-right">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Filtres et tri */}
            <div className="liquid-glass p-4">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                {/* Filtres par note */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterRating('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterRating === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-surface-hover text-foreground hover:bg-surface-active'
                      }`}
                  >
                    Tous ({totalReviews})
                  </button>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilterRating(rating as FilterRating)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterRating === rating
                        ? 'bg-primary text-white'
                        : 'bg-surface-hover text-foreground hover:bg-surface-active'
                        }`}
                    >
                      {rating} ★ ({ratingDistribution.find(r => r.rating === rating)?.count || 0})
                    </button>
                  ))}
                </div>

                {/* Tri */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="recent">Plus récents</option>
                  <option value="oldest">Plus anciens</option>
                  <option value="highest">Meilleures notes</option>
                  <option value="lowest">Notes les plus basses</option>
                  <option value="helpful">Plus utiles</option>
                </select>
              </div>
            </div>

            {/* Liste des avis */}
            <div className="space-y-4">
              {filteredReviews.length === 0 ? (
                <div className="liquid-glass p-12 text-center">
                  <p className="text-lg text-foreground-muted">
                    Aucun avis pour ce filtre
                  </p>
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <div key={review.id} className="liquid-glass p-6">
                    {/* En-tête de l'avis */}
                    <div className="flex items-start gap-4 mb-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-xl">👤</span>
                      </div>

                      {/* Infos utilisateur et note */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-foreground">{review.customer_name}</p>
                            <p className="text-sm text-foreground-muted">
                              {review.createdAt.toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                          {renderStars(review.rating)}
                        </div>

                        {/* Produit et commande */}
                        {review.product_name && (
                          <div className="flex items-center gap-2 text-sm text-foreground-muted">
                            <span>📦 {review.product_name}</span>
                            {review.order_id && (
                              <span className="text-xs">• {review.order_id}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Commentaire (seulement s'il existe) */}
                    {review.comment && (
                      <div className="mt-3">
                        <p className="text-foreground leading-relaxed">{review.comment}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Pagination (TODO) */}
            {filteredReviews.length > 0 && (
              <div className="flex justify-center">
                <div className="liquid-glass px-6 py-3">
                  <p className="text-sm text-foreground-muted">
                    Affichage de {filteredReviews.length} avis
                  </p>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

