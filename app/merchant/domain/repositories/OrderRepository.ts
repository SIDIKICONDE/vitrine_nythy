/**
 * Repository: OrderRepository
 * Interface pour la persistance des commandes
 */

import { Order } from '../entities/Order';
import { OrderStatus } from '../enums/OrderStatus';

export interface OrderRepository {
  // CRUD
  getOrderById(id: string): Promise<Order | null>;
  createOrder(order: Order): Promise<void>;
  updateOrder(order: Order): Promise<void>;

  // Recherche
  getOrdersByStore(merchantId: string): Promise<Order[]>;
  getOrdersByUser(userId: string): Promise<Order[]>;

  // Gestion
  updateOrderStatus(id: string, status: OrderStatus): Promise<void>;
}

