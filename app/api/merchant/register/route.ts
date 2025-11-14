import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { adminDb } from '@/lib/firebase-admin';
import { isSafeInput, sanitizeEmail, sanitizeText } from '@/lib/security/sanitization';
import { logSqlInjectionAttempt, logXssAttempt } from '@/lib/security/security-logger';
import { merchantRegisterSchema, withValidation } from '@/lib/security/validation';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/merchant/register
 * Inscrit un nouveau marchand
 * 🔐 Protégé par App Check avec protection contre le rejeu
 * 1. Crée l'utilisateur dans Firebase Auth
 * 2. Crée le document merchant dans Firestore
 */
export async function POST(request: NextRequest) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT EN PRODUCTION, PERMISSIF EN DEV
    const isDev = process.env['NODE_ENV'] === 'development';
    const appCheckResult = await verifyAppCheckToken(request, {
      strict: !isDev, // Strict uniquement en production
      consumeToken: !isDev // Protection contre le rejeu uniquement en production
    });
    if (appCheckResult instanceof NextResponse) {
      return appCheckResult;
    }

    // ✅ Validation avec Zod + Sanitization
    return withValidation(request, {
      schema: merchantRegisterSchema,
      source: 'body',
    }, async (validatedData) => {
      // Sanitization supplémentaire
      const email = sanitizeEmail(validatedData.email);
      const businessName = sanitizeText(validatedData.businessName);

      // Détection de patterns malveillants
      const emailCheck = isSafeInput(email);
      const nameCheck = isSafeInput(businessName);

      if (!emailCheck.safe) {
        await logSqlInjectionAttempt(request, email);
        return NextResponse.json(
          { success: false, message: 'Données invalides détectées' },
          { status: 400 }
        );
      }

      if (!nameCheck.safe) {
        if (nameCheck.reason?.includes('XSS')) {
          await logXssAttempt(request, businessName);
        } else {
          await logSqlInjectionAttempt(request, businessName);
        }
        return NextResponse.json(
          { success: false, message: 'Données invalides détectées' },
          { status: 400 }
        );
      }

      console.log('🚀 [API] Démarrage de l\'inscription marchand...');
      console.log('📥 [API] Données validées:', { email, businessName });

      // Étape 1: Créer l'utilisateur dans Firebase Auth (Admin SDK)
      console.log('🔐 [API] Création de l\'utilisateur Firebase Auth...');
      const adminAuth = getAuth();
      let userId: string;

      try {
        const userRecord = await adminAuth.createUser({
          email: email,
          password: validatedData.password,
          emailVerified: false,
        });
        userId = userRecord.uid;
        console.log('✅ [API] Utilisateur créé:', userId);
      } catch (authError: any) {
        console.error('❌ [API] Erreur Firebase Auth:', authError);

        if (authError.code === 'auth/email-already-exists') {
          return NextResponse.json(
            { success: false, message: 'Cet email est déjà utilisé' },
            { status: 400 }
          );
        }

        if (authError.code === 'auth/invalid-email') {
          return NextResponse.json(
            { success: false, message: 'Email invalide' },
            { status: 400 }
          );
        }

        if (authError.code === 'auth/weak-password') {
          return NextResponse.json(
            { success: false, message: 'Le mot de passe est trop faible' },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { success: false, message: 'Erreur lors de la création du compte: ' + (authError.message || 'Erreur inconnue') },
          { status: 500 }
        );
      }

      // Coordonnées par défaut pour Paris si non fournies
      const latitude = validatedData.address?.latitude || 48.8566;
      const longitude = validatedData.address?.longitude || 2.3522;

      // Étape 2: Créer le document merchant dans Firestore
      console.log('📝 [API] Création du document merchant...');

      // Utiliser serverTimestamp() pour garantir la compatibilité avec Firestore
      const now = FieldValue.serverTimestamp();

      // Détecter le timezone basé sur la ville/pays ou utiliser celui du client
      // Pour la France métropolitaine, utiliser Europe/Paris
      // Pour les DOM-TOM, adapter selon le code postal
      let detectedTimezone = 'Europe/Paris'; // Par défaut

      const postalCode = validatedData.address?.postalCode;
      if (postalCode) {
        const postalPrefix = postalCode.substring(0, 2);
        // DOM-TOM
        if (postalPrefix === '97') {
          const dept = postalCode.substring(0, 3);
          switch (dept) {
            case '971': detectedTimezone = 'America/Guadeloupe'; break;
            case '972': detectedTimezone = 'America/Martinique'; break;
            case '973': detectedTimezone = 'America/Cayenne'; break;
            case '974': detectedTimezone = 'Indian/Reunion'; break;
            case '976': detectedTimezone = 'Indian/Mayotte'; break;
            default: detectedTimezone = 'Europe/Paris';
          }
        }
      }

      const address = validatedData.address;
      const merchantData = {
        // Informations de base (déjà sanitizées)
        name: businessName,
        name_lowercase: businessName.toLowerCase(),
        email: email,
        phone: validatedData.phone ? sanitizeText(validatedData.phone) : '+33600000000',
        description: validatedData.description ? sanitizeText(validatedData.description) : '',

        // Adresse (sanitizée)
        address: address ? sanitizeText(address.street || '') : '',
        addressLine1: address ? sanitizeText(address.street || '') : '',
        city: address ? sanitizeText(address.city || '') : '',
        postalCode: address?.postalCode || '',
        country: address?.country || 'France',
        countryCode: 'FR',

        // Localisation (objet avec latitude, longitude)
        location: {
          latitude,
          longitude,
        },

        // Type d'activité (3 formats pour compatibilité maximale)
        category: 'autre',
        merchantType: 'autre',
        type: 'autre', // Format court pour compatibilité

        // Propriétaire (3 versions pour compatibilité)
        ownerUserId: userId,
        ownerId: userId,
        owner_user_id: userId,

        // Identifiants légaux (sanitizés)
        taxId: validatedData.siret ? sanitizeText(validatedData.siret) : '00000000000000',
        siret: validatedData.siret ? sanitizeText(validatedData.siret) : '00000000000000',

        // Statuts
        status: 'pending',
        verificationStatus: 'pending', // Pour compatibilité avec Flutter Admin
        isActive: true,
        isVerified: false,
        rating: 0,
        reviewCount: 0,
        totalSales: 0,

        // Options
        acceptsSurpriseBox: false,
        languages: ['fr'],
        preferredCurrency: 'EUR',
        timezone: detectedTimezone,

        // Livraison
        deliveryOptions: {
          inStorePickup: true,
          localDelivery: false,
        },

        // Horaires d'ouverture (vides par défaut)
        openingHours: {},

        // Informations complémentaires (vides par défaut)
        features: [],
        certifications: [],
        paymentMethods: ['card', 'cash'], // Par défaut: CB et espèces

        // Réseaux sociaux (vides par défaut)
        website: '',
        instagram: '',
        facebook: '',

        // Images (vides par défaut)
        logo: null,
        logo_url: null,
        banner: null,
        banner_url: null,
        imageUrls: [],

        // Paramètres de notifications
        notifications: {
          email: true,
          sms: false,
          push: true,
        },

        // Paramètres de confidentialité (par défaut: privé pour protéger les données)
        privacy: {
          showPhone: false,  // Téléphone privé par défaut
          showEmail: false,  // Email privé par défaut
          showAddress: true, // Adresse publique (nécessaire pour la géolocalisation)
        },

        // Préférences générales
        preferences: {
          language: 'fr',
          currency: 'EUR',
          timezone: detectedTimezone,
        },

        // Informations bancaires (vides par défaut)
        iban: null,
        bic: null,
        paymentPreference: 'monthly', // weekly, biweekly, monthly, manual

        // Statistiques initiales complètes (toutes à 0)
        stats: {
          // Commandes et ventes
          totalOrders: 0,
          totalSales: 0,
          totalRevenue: 0,

          // Avis et notes
          averageRating: 0,
          totalReviews: 0,
          reviewCount: 0,

          // Produits et offres
          productsCount: 0,
          productCount: 0,
          offerCount: 0,

          // Followers et engagement
          followersCount: 0,
          followerCount: 0,

          // Favoris et sauvegarde
          savedItemsCount: 0,
          favoriteCount: 0,

          // Vues
          viewCount: 0,

          // Impact environnemental
          co2Saved: 0,

          // Dernière mise à jour
          lastUpdated: now,
        },

        // Timestamps (format ISO string)
        createdAt: now,
        updatedAt: now,
        termsAcceptedAt: now,
      };

      try {
        // Créer le document merchant
        const merchantRef = await adminDb.collection('merchants').add(merchantData);
        const merchantId = merchantRef.id;

        console.log('✅ [API] Merchant créé avec ID:', merchantId);

        // Étape 3: Créer/mettre à jour le document users avec le merchantId et le rôle
        // (IMPORTANT: Alignement avec le Dart - voir merchants.js ligne 145-149)
        console.log('📝 [API] Mise à jour du document users avec merchantId...');

        try {
          await adminDb.collection('users').doc(userId).set({
            role: 'storeOwner',
            merchantId: merchantId,
            email: email,
            createdAt: now,
            updatedAt: now,
          }, { merge: true }); // merge: true pour ne pas écraser si le doc existe déjà

          console.log('✅ [API] Document users mis à jour avec merchantId');
        } catch (usersError: any) {
          console.error('❌ [API] Erreur lors de la mise à jour users:', usersError);
          // Continue quand même, le merchant a été créé
        }

        // Créer la sous-collection stats (pour compatibilité avec Flutter)
        try {
          await merchantRef.collection('stats').doc('summary').set({
            // Stats principales
            totalOrders: 0,
            totalRevenue: 0,
            totalSales: 0,
            averageRating: 0,
            totalReviews: 0,
            followersCount: 0,
            productsCount: 0,
            savedItemsCount: 0,
            co2Saved: 0,

            // Vues et engagement
            viewCount: 0,
            favoriteCount: 0,
            productCount: 0,
            offerCount: 0,

            // Tendances (toutes à 0% au départ)
            trends: {
              orders: 0,
              revenue: 0,
              followers: 0,
              rating: 0,
            },

            // Dernière mise à jour
            lastUpdated: now,
          });
          console.log('✅ [API] Sous-collection stats créée avec toutes les statistiques à 0');
        } catch (statsError: any) {
          console.error('⚠️  [API] Erreur lors de la création stats:', statsError);
          // Continue quand même
        }

        // Créer les sous-collections vides avec documents de référence
        // (nécessaire pour initialiser les collections vides dans Firestore)

        // 1. Customers
        try {
          await merchantRef.collection('customers').doc('_init').set({
            initialized: true,
            createdAt: now,
            totalCustomers: 0,
            description: 'Document de référence pour initialiser la collection customers',
          });
          console.log('✅ [API] Sous-collection customers initialisée');
        } catch (customersError: any) {
          console.error('⚠️  [API] Erreur lors de l\'initialisation customers:', customersError);
        }

        // 2. Products
        try {
          await merchantRef.collection('products').doc('_init').set({
            initialized: true,
            createdAt: now,
            totalProducts: 0,
            description: 'Document de référence pour initialiser la collection products',
          });
          console.log('✅ [API] Sous-collection products initialisée');
        } catch (productsError: any) {
          console.error('⚠️  [API] Erreur lors de l\'initialisation products:', productsError);
        }

        // 3. Orders (sous-collection pour historique local du marchand)
        try {
          await merchantRef.collection('orders').doc('_init').set({
            initialized: true,
            createdAt: now,
            totalOrders: 0,
            description: 'Document de référence pour initialiser la collection orders locale',
          });
          console.log('✅ [API] Sous-collection orders initialisée');
        } catch (ordersError: any) {
          console.error('⚠️  [API] Erreur lors de l\'initialisation orders:', ordersError);
        }

        // 4. Reviews
        try {
          await merchantRef.collection('reviews').doc('_init').set({
            initialized: true,
            createdAt: now,
            totalReviews: 0,
            description: 'Document de référence pour initialiser la collection reviews',
          });
          console.log('✅ [API] Sous-collection reviews initialisée');
        } catch (reviewsError: any) {
          console.error('⚠️  [API] Erreur lors de l\'initialisation reviews:', reviewsError);
        }

        // 5. Finances - Document récapitulatif
        try {
          await merchantRef.collection('finances').doc('summary').set({
            // Revenus
            totalRevenue: 0,
            netRevenue: 0,

            // Commandes
            totalOrders: 0,
            completedOrders: 0,
            cancelledOrders: 0,

            // Commissions et frais
            totalCommissions: 0,
            totalFees: 0,
            commissionRate: 0.15, // 15% par défaut

            // Versements
            totalPayouts: 0,
            pendingPayouts: 0,
            availableBalance: 0,

            // Statistiques
            averageOrderValue: 0,

            // Dates
            lastPayoutDate: null,
            nextPayoutDate: null,

            // Méta
            lastUpdated: now,
            createdAt: now,
          });
          console.log('✅ [API] Sous-collection finances initialisée');
        } catch (financesError: any) {
          console.error('⚠️  [API] Erreur lors de l\'initialisation finances:', financesError);
        }

        // 6. Transactions (vide pour commencer)
        try {
          await merchantRef.collection('transactions').doc('_init').set({
            initialized: true,
            createdAt: now,
            totalTransactions: 0,
            description: 'Document de référence pour initialiser la collection transactions',
          });
          console.log('✅ [API] Sous-collection transactions initialisée');
        } catch (transactionsError: any) {
          console.error('⚠️  [API] Erreur lors de l\'initialisation transactions:', transactionsError);
        }

        // 7. Payouts (versements)
        try {
          await merchantRef.collection('payouts').doc('_init').set({
            initialized: true,
            createdAt: now,
            totalPayouts: 0,
            description: 'Document de référence pour initialiser la collection payouts',
          });
          console.log('✅ [API] Sous-collection payouts initialisée');
        } catch (payoutsError: any) {
          console.error('⚠️  [API] Erreur lors de l\'initialisation payouts:', payoutsError);
        }

        return NextResponse.json({
          success: true,
          userId,
          merchantId,
          message: 'Inscription réussie ! Bienvenue sur Nythy.',
        });
      } catch (firestoreError: any) {
        console.error('❌ [API] Erreur Firestore:', firestoreError);

        // Si la création Firestore échoue, on devrait idéalement supprimer l'utilisateur Auth
        // mais on laisse comme ça pour le moment

        return NextResponse.json(
          { success: false, message: 'Erreur lors de la création du profil marchand' },
          { status: 500 }
        );
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription marchand:', error);

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'inscription',
      },
      { status: 500 }
    );
  }
}

