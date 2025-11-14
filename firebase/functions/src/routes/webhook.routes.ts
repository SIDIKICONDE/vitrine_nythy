import express, { Router } from 'express';
import * as admin from 'firebase-admin';
import Stripe from 'stripe';
import { confirmPaymentAndCreateOrder, stripe } from '../services/stripe.service';
import { ReservationStatus, WebhookMetadata } from '../types';

export const webhookRoutes = Router();

// Important: Le webhook doit recevoir le body brut (raw) pour la signature
webhookRoutes.post(
  '/stripe',
  express.raw({ type: 'application/json' }),
  async (req, res): Promise<void> => {
    // Vérifier que Stripe est configuré
    if (!stripe) {
      console.error('Stripe not configured');
      res.status(500).send('Stripe not configured');
      return;
    }

    const sig = req.headers['stripe-signature'];

    if (!sig) {
      console.error('Missing Stripe signature');
      res.status(400).send('Missing signature');
      return;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Webhook secret not configured');
      res.status(500).send('Webhook not configured');
      return;
    }

    let event;

    try {
      // Vérifier la signature du webhook
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Webhook signature verification failed:', errorMessage);
      res.status(400).send(`Webhook Error: ${errorMessage}`);
      return;
    }

    console.log('Webhook event received:', event.type);

    // Gérer les différents types d'événements
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object);
          break;

        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object);
          break;

        case 'payment_intent.canceled':
          await handlePaymentIntentCanceled(event.data.object);
          break;

        case 'charge.refunded':
          await handleChargeRefunded(event.data.object);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: errorMessage });
    }
  }
);

/**
 * Gérer le succès d'un paiement
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  try {
    // Créer la commande
    const order = await confirmPaymentAndCreateOrder(paymentIntent.id);
    console.log('Order created from webhook:', order.id);

    // TODO: Envoyer une notification à l'utilisateur
    // TODO: Envoyer une notification au marchand

  } catch (error) {
    console.error('Error creating order from webhook:', error);
    throw error;
  }
}

/**
 * Gérer l'échec d'un paiement
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  const metadata = paymentIntent.metadata as unknown as WebhookMetadata;
  const { reservationId } = metadata;

  if (reservationId) {
    // Mettre à jour la réservation
    const db = admin.firestore();

    await db.collection('reservations').doc(reservationId).update({
      status: ReservationStatus.PAYMENT_FAILED,
      paymentError: paymentIntent.last_payment_error?.message || 'Unknown error',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // TODO: Envoyer une notification à l'utilisateur
}

/**
 * Gérer l'annulation d'un paiement
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment canceled:', paymentIntent.id);

  const metadata = paymentIntent.metadata as unknown as WebhookMetadata;
  const { reservationId } = metadata;

  if (reservationId) {
    const db = admin.firestore();

    await db.collection('reservations').doc(reservationId).update({
      status: ReservationStatus.CANCELED,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}

/**
 * Gérer un remboursement
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id);

  // Récupérer le Payment Intent associé
  const paymentIntentId = charge.payment_intent;

  if (paymentIntentId) {
    const db = admin.firestore();

    // Trouver la commande associée
    const ordersSnapshot = await db
      .collection('orders')
      .where('paymentIntentId', '==', paymentIntentId)
      .limit(1)
      .get();

    if (!ordersSnapshot.empty) {
      const orderDoc = ordersSnapshot.docs[0];

      if (orderDoc) {
        await orderDoc.ref.update({
          status: 'refunded',
          refundedAt: admin.firestore.FieldValue.serverTimestamp(),
          refundAmount: charge.amount_refunded,
        });

        console.log('Order refunded:', orderDoc.id);
      }
    }
  }

  // TODO: Envoyer une notification à l'utilisateur
  // TODO: Envoyer une notification au marchand
}
