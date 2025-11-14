/**
 * GetOrdersByStoreUseCase - Obtenir les commandes d'un commerçant
 */

import { Order } from '../entities/Order';
import { OrderRepository } from '../repositories/OrderRepository';
import { OrderStatus } from '../enums/OrderStatus';

export class GetOrdersByStoreUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(
    merchantId: string,
    status?: OrderStatus,
    limit: number = 50,
    offset: number = 0
  ): Promise<Order[]> {
    if (!merchantId || merchantId.trim() === '') {
      throw new Error('Merchant ID is required');
    }

    return await this.orderRepository.getOrdersByStore(merchantId, status, limit, offset);
  }
}

