/**
 * Repository pour accéder aux API du dashboard
 */

interface TopProduct {
  id: string;
  title: string;
  imageUrl?: string;
  sales: number;
  revenue: number;
  rating: number;
}

interface WeeklyRevenue {
  label: string;
  value: number;
}

interface Activity {
  id: string;
  type: string;
  icon: string;
  title: string;
  description: string;
  timestamp: string;
}

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  followersCount: number;
  productsCount: number;
  activeProducts: number;
  savedItemsCount: number;
  co2Saved: number;
  pendingOrders: number;
  todayRevenue: number;
}

interface DashboardTrends {
  orders: number;
  revenue: number;
  followers: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: number;
  total: number;
  status: string;
  createdAt: string;
}

class ApiDashboardRepository {
  private baseUrl = '/api/merchant';

  /**
   * Récupère les statistiques complètes du dashboard
   */
  async getStats(merchantId: string): Promise<{
    stats: DashboardStats;
    trends: DashboardTrends;
  }> {
    const response = await fetch(`${this.baseUrl}/${merchantId}/dashboard`);
    
    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erreur getStats:', error);
      
      // Retourner des données vides en cas d'erreur
      return {
        stats: {
          totalOrders: 0,
          totalRevenue: 0,
          averageRating: 0,
          totalReviews: 0,
          followersCount: 0,
          productsCount: 0,
          activeProducts: 0,
          savedItemsCount: 0,
          co2Saved: 0,
          pendingOrders: 0,
          todayRevenue: 0,
        },
        trends: {
          orders: 0,
          revenue: 0,
          followers: 0,
        },
      };
    }

    const data = await response.json();
    return {
      stats: data.dashboard.stats,
      trends: data.dashboard.trends,
    };
  }

  /**
   * Récupère les top produits
   */
  async getTopProducts(merchantId: string): Promise<TopProduct[]> {
    const response = await fetch(`${this.baseUrl}/${merchantId}/dashboard`);
    
    if (!response.ok) {
      console.error('❌ Erreur getTopProducts');
      return [];
    }

    const data = await response.json();
    return data.dashboard.topProducts || [];
  }

  /**
   * Récupère les revenus hebdomadaires
   */
  async getWeeklyRevenue(merchantId: string): Promise<WeeklyRevenue[]> {
    const response = await fetch(`${this.baseUrl}/${merchantId}/dashboard`);
    
    if (!response.ok) {
      console.error('❌ Erreur getWeeklyRevenue');
      return [];
    }

    const data = await response.json();
    return data.dashboard.weeklyRevenue || [];
  }

  /**
   * Récupère les activités récentes
   */
  async getActivities(merchantId: string): Promise<Activity[]> {
    const response = await fetch(`${this.baseUrl}/${merchantId}/dashboard`);
    
    if (!response.ok) {
      console.error('❌ Erreur getActivities');
      return [];
    }

    const data = await response.json();
    return data.dashboard.activities || [];
  }

  /**
   * Récupère les commandes récentes
   */
  async getRecentOrders(merchantId: string): Promise<RecentOrder[]> {
    const response = await fetch(`${this.baseUrl}/${merchantId}/dashboard`);
    
    if (!response.ok) {
      console.error('❌ Erreur getRecentOrders');
      return [];
    }

    const data = await response.json();
    return data.dashboard.recentOrders || [];
  }
}

const apiDashboardRepository = new ApiDashboardRepository();
export default apiDashboardRepository;
