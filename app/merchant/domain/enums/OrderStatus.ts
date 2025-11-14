/**
 * Énumération: OrderStatus
 * Statut d'une commande
 */

export enum OrderStatus {
  PENDING = 'pending', // ⏳ En attente
  CONFIRMED = 'confirmed', // ✅ Confirmée
  CANCELLED = 'cancelled', // ❌ Annulée
  COMPLETED = 'completed', // 🏁 Complétée
}

/**
 * Labels en français
 */
export const OrderStatusLabels: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: '⏳ En attente',
  [OrderStatus.CONFIRMED]: '✅ Confirmée',
  [OrderStatus.CANCELLED]: '❌ Annulée',
  [OrderStatus.COMPLETED]: '🏁 Complétée',
};

/**
 * Obtenir le label d'un statut
 */
export function getOrderStatusLabel(status: OrderStatus): string {
  return OrderStatusLabels[status] || status;
}

