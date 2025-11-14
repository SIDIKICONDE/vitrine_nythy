import Stripe from 'stripe';

// Types Firebase
export interface FirebaseReservation {
  id: string;
  userId: string;
  offerId: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: ReservationStatus;
  expiresAt: FirebaseFirestore.Timestamp;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
  completedAt?: FirebaseFirestore.Timestamp;
  paymentIntentId?: string;
  paymentIntentClientSecret?: string;
  stripeCustomerId?: string;
  orderId?: string;
  offerData?: Record<string, unknown>;
  merchantData?: Record<string, unknown>;
  paymentError?: string;
}

export interface FirebaseOrder {
  id: string;
  reservationId: string;
  userId: string;
  offerId: string;
  merchantId: string;
  amount: number;
  currency: string;
  status: OrderStatus;
  pickupCode: string;
  paymentIntentId: string;
  qrCodeData?: string;
  qrCodeTimestamp?: string;
  createdAt: FirebaseFirestore.Timestamp;
  confirmedAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  readyAt?: FirebaseFirestore.Timestamp;
  pickedUpAt?: FirebaseFirestore.Timestamp;
  refundedAt?: FirebaseFirestore.Timestamp;
  refundAmount?: number;
  offerData?: Record<string, unknown>;
  merchantData?: Record<string, unknown>;
}

export interface FirebaseUser {
  id: string;
  email: string;
  displayName: string;
  stripeCustomerId?: string;
}

// Types API
export interface CreatePaymentIntentRequest {
  reservationId: string;
  userId: string;
  amount: number;
  currency?: string;
}

export interface CreatePaymentIntentResponse {
  success: boolean;
  paymentIntent: {
    id: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: Stripe.PaymentIntent.Status;
  };
}

export interface CancelPaymentRequest {
  paymentIntentId: string;
}

export interface CancelPaymentResponse {
  success: boolean;
  paymentIntent: {
    id: string;
    status: Stripe.PaymentIntent.Status;
  };
}

export interface GetCustomerResponse {
  success: boolean;
  customer: {
    email: string;
    name: string;
    stripeCustomerId?: string;
  };
}

export interface ErrorResponse {
  error: string;
  message: string;
}

// Enums
export enum ReservationStatus {
  PENDING = 'PENDING',
  PAYMENT_PROCESSING = 'PAYMENT_PROCESSING',
  COMPLETED = 'COMPLETED',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export enum OrderStatus {
  CONFIRMED = 'confirmed',
  READY_FOR_PICKUP = 'ready_for_pickup',
  PICKED_UP = 'picked_up',
  REFUNDED = 'refunded',
  CANCELED = 'canceled',
}

// Types Webhook
export interface WebhookMetadata {
  reservationId: string;
  userId: string;
  offerId: string;
  merchantId: string;
}
