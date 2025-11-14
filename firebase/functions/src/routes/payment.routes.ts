import { Request, Response, Router } from 'express';
import * as admin from 'firebase-admin';
import { requireAuth } from '../middleware/auth.middleware';
import { cancelPaymentIntent, createPaymentIntent } from '../services/stripe.service';
import {
  CancelPaymentRequest,
  CancelPaymentResponse,
  CreatePaymentIntentRequest,
  CreatePaymentIntentResponse,
  ErrorResponse,
  FirebaseUser,
  GetCustomerResponse,
} from '../types';

export const paymentRoutes = Router();

// Middleware d'authentification avec rate limiting sur toutes les routes
// requireAuth() retourne [apiRateLimit, authenticateUser]
requireAuth().forEach((middleware) => {
  paymentRoutes.use(middleware);
});

/**
 * POST /api/v1/payments/create-intent
 * Crée un Payment Intent Stripe
 */
paymentRoutes.post(
  '/create-intent',
  async (req: Request<{}, CreatePaymentIntentResponse | ErrorResponse, CreatePaymentIntentRequest>, res: Response<CreatePaymentIntentResponse | ErrorResponse>) => {
    try {
      const { reservationId, userId } = req.body;

      // Valider les données
      if (!reservationId || !userId) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'reservationId and userId are required',
        });
      }

      // Vérifier que l'utilisateur authentifié correspond
      if (req.user?.uid !== userId) {
        return res.status(403).json({
          error: 'Unauthorized',
          message: 'User ID mismatch'
        });
      }

      // Créer le Payment Intent (montant recalculé côté serveur)
      const paymentIntent = await createPaymentIntent(
        userId,
        reservationId
      );

      return res.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          clientSecret: paymentIntent.client_secret || '',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
        },
      });
    } catch (error) {
      console.error('Error in create-intent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        error: 'Failed to create payment intent',
        message: errorMessage,
      });
    }
  }
);

/**
 * POST /api/v1/payments/cancel
 * Annule un Payment Intent
 */
paymentRoutes.post(
  '/cancel',
  async (req: Request<{}, CancelPaymentResponse | ErrorResponse, CancelPaymentRequest>, res: Response<CancelPaymentResponse | ErrorResponse>) => {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        return res.status(400).json({
          error: 'Missing paymentIntentId',
          message: 'Payment intent ID is required'
        });
      }

      const paymentIntent = await cancelPaymentIntent(paymentIntentId);

      return res.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
        },
      });
    } catch (error) {
      console.error('Error in cancel payment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        error: 'Failed to cancel payment',
        message: errorMessage,
      });
    }
  }
);

/**
 * GET /api/v1/payments/customer
 * Récupère les informations du customer Stripe
 */
paymentRoutes.get(
  '/customer',
  async (req: Request, res: Response<GetCustomerResponse | ErrorResponse>) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const db = admin.firestore();
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data() as FirebaseUser | undefined;

      return res.json({
        success: true,
        customer: {
          email: userData?.email || '',
          name: userData?.displayName || '',
          stripeCustomerId: userData?.stripeCustomerId,
        },
      });
    } catch (error) {
      console.error('Error getting customer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({
        error: 'Failed to get customer',
        message: errorMessage,
      });
    }
  }
);
