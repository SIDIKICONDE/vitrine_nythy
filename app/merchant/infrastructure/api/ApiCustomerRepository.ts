/**
 * Repository pour les opérations liées aux clients via API
 */

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  completedOrders: number;
  totalSpent: number;
  lastOrderDate: string;
  firstOrderDate: string;
  isVIP: boolean;
}

export class ApiCustomerRepository {
  private baseUrl: string;

  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Récupère tous les clients d'un marchand
   */
  async getCustomers(merchantId: string): Promise<Customer[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/merchant/${merchantId}/customers`,
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
        throw new Error(errorData.message || 'Erreur lors de la récupération des clients');
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la récupération des clients');
      }

      return data.customers;
    } catch (error) {
      console.error('Erreur getCustomers:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des clients
   */
  async getCustomersStats(merchantId: string) {
    const customers = await this.getCustomers(merchantId);

    return {
      total: customers.length,
      vip: customers.filter(c => c.isVIP).length,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      avgOrderValue: customers.length > 0
        ? customers.reduce((sum, c) => sum + c.totalSpent, 0) /
        customers.reduce((sum, c) => sum + c.totalOrders, 0)
        : 0,
    };
  }
}

// Instance singleton
const apiCustomerRepository = new ApiCustomerRepository();
export default apiCustomerRepository;

