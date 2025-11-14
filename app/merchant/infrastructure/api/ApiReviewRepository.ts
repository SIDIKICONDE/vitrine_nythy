/**
 * Repository pour les opérations liées aux avis via API
 */

import { createAuthHeaders } from '@/lib/csrf-client';

export interface Review {
  id: string;
  customer_name: string;
  customer_avatar?: string;
  rating: number;
  comment: string;
  created_at: string;
  order_id?: string;
  product_name?: string;
  merchant_response?: string;
  response_date?: string;
  helpful: number;
  images?: string[];
}

export class ApiReviewRepository {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Récupère tous les avis d'un marchand
   */
  async getMerchantReviews(merchantId: string): Promise<Review[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/merchant/${merchantId}/reviews`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de la récupération des avis');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des avis');
      }

      return data.reviews;
    } catch (error) {
      console.error('Erreur getMerchantReviews:', error);
      throw error;
    }
  }

  /**
   * Répond à un avis
   */
  async respondToReview(merchantId: string, reviewId: string, response: string): Promise<void> {
    try {
      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const apiResponse = await fetch(
        `${this.baseUrl}/merchant/${merchantId}/reviews`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({ reviewId, response }),
        }
      );

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Erreur lors de l\'enregistrement de la réponse');
      }

      const data = await apiResponse.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de l\'enregistrement de la réponse');
      }
    } catch (error) {
      console.error('Erreur respondToReview:', error);
      throw error;
    }
  }

  /**
   * Calcule les statistiques des avis
   */
  async getReviewStats(merchantId: string) {
    const reviews = await this.getMerchantReviews(merchantId);

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews
      : 0;

    const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length,
      percentage: totalReviews > 0 
        ? (reviews.filter(r => r.rating === rating).length / totalReviews) * 100 
        : 0,
    }));

    return {
      totalReviews,
      averageRating,
      ratingDistribution,
    };
  }
}

// Instance singleton
const apiReviewRepository = new ApiReviewRepository();
export default apiReviewRepository;

