import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { checkFunctionRateLimit, logSecurityEvent } from '../middleware/auth.middleware';
import { FirebaseOrder, FirebaseReservation, FirebaseUser, OrderStatus } from '../types';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Stripe
// En développement: utilise .env via dotenv
// En production: utilise les variables d'environnement Firebase Functions
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

// Permettre le déploiement même sans clé configurée (pour éviter l'erreur)
let stripe: Stripe | null = null;

if (stripeSecretKey) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: true,
  });
}

export { stripe };

const db = admin.firestore();

/**
 * Crée un Payment Intent Stripe
 */
export async function createPaymentIntent(
  userId: string,
  reservationId: string,
): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    // 1. Rate limiting pour les paiements (5 tentatives/minute par utilisateur)
    if (!checkFunctionRateLimit(userId, 5, 60 * 1000)) {
      await logSecurityEvent('PAYMENT_RATE_LIMIT_EXCEEDED', {
        userId,
        reservationId,
        function: 'createPaymentIntent',
        timestamp: new Date().toISOString(),
      });
      throw new Error('Too many payment attempts. Please wait a moment.');
    }

    // 2. Vérifier que la réservation existe
    const reservationDoc = await db.collection('reservations').doc(reservationId).get();

    if (!reservationDoc.exists) {
      await logSecurityEvent('PAYMENT_RESERVATION_NOT_FOUND', {
        userId,
        reservationId,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Reservation not found');
    }

    const reservation = reservationDoc.data() as FirebaseReservation;

    // 3. Vérifier que l'utilisateur est le propriétaire
    if (reservation?.userId !== userId) {
      await logSecurityEvent('PAYMENT_UNAUTHORIZED_ACCESS', {
        userId,
        reservationId,
        reservationOwner: reservation?.userId,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Unauthorized');
    }

    // Vérifier expiration
    const expiresAt = reservation?.expiresAt?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      throw new Error('Reservation expired');
    }

    // 4. Déterminer le montant depuis la réservation (en cents)
    const amount = Number(reservation?.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      await logSecurityEvent('PAYMENT_INVALID_AMOUNT', {
        userId,
        reservationId,
        amount,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Invalid reservation amount');
    }

    // Montant min/max en cents (0.50€ à 500€)
    if (amount < 50 || amount > 50000) {
      await logSecurityEvent('PAYMENT_AMOUNT_OUT_OF_RANGE', {
        userId,
        reservationId,
        amount,
        min: 50,
        max: 50000,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Amount out of allowed range');
    }

    // 5. Validation supplémentaire : vérifier que le montant n'a pas changé depuis la création
    // Note: originalAmount est optionnel dans le type, mais utile pour détecter les manipulations
    const originalAmount = (reservation as any)?.originalAmount;
    if (originalAmount && amount !== originalAmount) {
      await logSecurityEvent('PAYMENT_AMOUNT_MISMATCH', {
        userId,
        reservationId,
        expected: originalAmount,
        received: amount,
        difference: amount - originalAmount,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Amount mismatch detected. Please refresh and try again.');
    }

    // Déterminer la devise depuis la réservation
    const currency = String(reservation?.currency || 'eur').toLowerCase();
    if (!['eur'].includes(currency)) {
      throw new Error('Unsupported currency');
    }

    // Créer ou récupérer le customer Stripe
    let customerId = reservation?.stripeCustomerId;

    if (!customerId) {
      // Récupérer les infos utilisateur
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data() as FirebaseUser | undefined;

      const customer = await stripe.customers.create({
        metadata: {
          firebaseUID: userId,
        },
        email: userData?.email,
        name: userData?.displayName,
      });

      customerId = customer.id;

      // Sauvegarder le customer ID
      await db.collection('reservations').doc(reservationId).update({
        stripeCustomerId: customerId,
      });
    }

    // Créer le Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: customerId,
      metadata: {
        reservationId,
        userId,
        offerId: reservation?.offerId || '',
        merchantId: reservation?.merchantId || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    }, {
      idempotencyKey: `pi_${reservationId}`,
    });

    // Mettre à jour la réservation (ne jamais stocker le client_secret)
    await db.collection('reservations').doc(reservationId).update({
      paymentIntentId: paymentIntent.id,
      status: 'PAYMENT_PROCESSING',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 6. Logger la création réussie du Payment Intent
    await logSecurityEvent('PAYMENT_INTENT_CREATED', {
      userId,
      reservationId,
      paymentIntentId: paymentIntent.id,
      amount,
      currency,
      status: paymentIntent.status,
      timestamp: new Date().toISOString(),
    });

    console.log('Payment Intent created:', paymentIntent.id);
    return paymentIntent;
  } catch (error) {
    console.error('Error creating Payment Intent:', error);
    throw error;
  }
}

/**
 * Confirme un paiement et crée la commande
 */
export async function confirmPaymentAndCreateOrder(
  paymentIntentId: string,
): Promise<FirebaseOrder> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    // Récupérer le Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not succeeded. Status: ${paymentIntent.status}`);
    }

    const { reservationId, userId, offerId, merchantId } = paymentIntent.metadata;

    // Récupérer la réservation
    const reservationDoc = await db.collection('reservations').doc(reservationId).get();

    if (!reservationDoc.exists) {
      throw new Error('Reservation not found');
    }

    const reservation = reservationDoc.data() as FirebaseReservation;

    // Récupérer les informations de l'utilisateur
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data() as FirebaseUser | undefined;
    const customerName = userData?.displayName || 'Client inconnu';
    const customerEmail = userData?.email || '';

    // Générer un code de retrait unique (6 chiffres)
    const pickupCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Créer un numéro de commande
    const orderNumber = `#NYT-${Date.now().toString().slice(-8)}`;

    // Formater les items à partir de offerData
    const offerData = reservation?.offerData || {};
    const items = [];
    if (offerData.title || offerData.name) {
      items.push({
        productName: offerData.title || offerData.name || 'Offre',
        quantity: 1,
        price: paymentIntent.amount / 100, // Convertir de centimes en euros
      });
    }

    // Créer la commande
    const orderId = `order_${Date.now()}_${userId.substring(0, 8)}`;
    const createdAt = admin.firestore.FieldValue.serverTimestamp();
    const confirmedAt = admin.firestore.FieldValue.serverTimestamp();

    const order: Omit<FirebaseOrder, 'createdAt' | 'confirmedAt' | 'expiresAt'> & {
      createdAt: admin.firestore.FieldValue;
      confirmedAt: admin.firestore.FieldValue;
      expiresAt: admin.firestore.Timestamp;
      // Champs supplémentaires pour l'API web
      created_at?: admin.firestore.FieldValue;
      customerName?: string;
      customerEmail?: string;
      customerId?: string;
      orderNumber?: string;
      items?: any[];
      total?: number;
      totalAmount?: number;
    } = {
      id: orderId,
      reservationId,
      userId,
      offerId: offerId || reservation?.offerId,
      merchantId: merchantId || reservation?.merchantId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: OrderStatus.CONFIRMED,
      pickupCode,
      paymentIntentId,
      createdAt,
      confirmedAt,
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      ),
      offerData: reservation?.offerData || {},
      merchantData: reservation?.merchantData || {},
      // Champs supplémentaires pour compatibilité avec l'API web
      created_at: createdAt, // Alias pour created_at
      customerName,
      customerEmail,
      customerId: userId,
      orderNumber,
      items: items.length > 0 ? items : undefined,
      total: paymentIntent.amount / 100, // Montant en euros
      totalAmount: paymentIntent.amount / 100, // Alias pour totalAmount
    };

    // Sauvegarder la commande
    await db.collection('orders').doc(orderId).set(order);

    // Mettre à jour la réservation
    await db.collection('reservations').doc(reservationId).update({
      status: 'COMPLETED',
      orderId,
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Logger la création réussie de la commande
    await logSecurityEvent('ORDER_CREATED', {
      userId,
      reservationId,
      orderId,
      paymentIntentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      pickupCode,
      timestamp: new Date().toISOString(),
    });

    console.log('Order created:', orderId);
    return order as FirebaseOrder;
  } catch (error) {
    console.error('Error confirming payment and creating order:', error);
    throw error;
  }
}

/**
 * Annule un Payment Intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
): Promise<Stripe.PaymentIntent> {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    // Récupérer le Payment Intent pour obtenir les métadonnées
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    const { userId, reservationId } = paymentIntent.metadata;

    // Annuler le Payment Intent
    const cancelledIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    // Logger l'annulation
    await logSecurityEvent('PAYMENT_INTENT_CANCELLED', {
      userId: userId || 'unknown',
      reservationId: reservationId || 'unknown',
      paymentIntentId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      timestamp: new Date().toISOString(),
    });

    console.log('Payment Intent cancelled:', paymentIntentId);
    return cancelledIntent;
  } catch (error) {
    console.error('Error cancelling Payment Intent:', error);
    throw error;
  }
}
