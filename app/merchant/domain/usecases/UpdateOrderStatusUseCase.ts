/**
 * Use Case: UpdateOrderStatusUseCase
 * Mettre à jour le statut d'une commande
 */

import { OrderStatus } from '../enums/OrderStatus';
import { OrderRepository } from '../repositories/OrderRepository';
import { OrderNotFoundException, OrderInvalidStatusException } from '../exceptions/OrderExceptions';

export class UpdateOrderStatusUseCase {
  constructor(private readonly orderRepository: OrderRepository) {}

  async execute(orderId: string, newStatus: OrderStatus): Promise<void> {
    // Récupérer la commande
    const order = await this.orderRepository.getOrderById(orderId);
    if (!order) {
      throw new OrderNotFoundException(`Commande introuvable: ${orderId}`);
    }

    // Vérifier la transition de statut
    if (!this.isValidTransition(order.status, newStatus)) {
      throw new OrderInvalidStatusException(
        `Transition invalide de ${order.status} vers ${newStatus}`
      );
    }

    // Mettre à jour le statut
    await this.orderRepository.updateOrderStatus(orderId, newStatus);
  }

  /**
   * Vérifier si la transition de statut est valide
   */
  private isValidTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
    // Les transitions valides
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.CANCELLED]: [], // Aucune transition depuis CANCELLED
      [OrderStatus.COMPLETED]: [], // Aucune transition depuis COMPLETED
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }
}

