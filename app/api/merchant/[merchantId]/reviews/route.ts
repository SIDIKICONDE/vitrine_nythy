import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Transforme un avis Firestore (snake_case) en format pour l'affichage
 */
async function transformReviewForFlutter(reviewId: string, data: any) {
  console.log('🔍 [API] Transformation rating:', { reviewId, fields: Object.keys(data) });

  // 🎯 Récupérer le nom du client depuis profiles
  let customerName = data.customer_name || data.userName || data.user_name;
  const userId = data.user_id || data.userId;

  if (!customerName && userId) {
    try {
      // Essayer depuis profiles
      const profileDoc = await adminDb.collection('profiles').doc(userId).get();
      if (profileDoc.exists) {
        const profileData = profileDoc.data();
        customerName = profileData?.['displayName'] || profileData?.['display_name'];
      }

      // Si toujours pas, essayer depuis users
      if (!customerName) {
        const userDoc = await adminDb.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          customerName = userData?.['displayName'] || userData?.['display_name'] || userData?.['email']?.split('@')[0];
        }
      }
    } catch (error) {
      console.log('⚠️ [API] Impossible de récupérer le nom pour userId:', userId);
    }
  }

  // 🎯 Convertir les Timestamps Firestore en ISO strings
  const convertTimestamp = (timestamp: any): string | null => {
    if (!timestamp) return null;

    try {
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Firestore Timestamp avec méthode toDate()
        return timestamp.toDate().toISOString();
      } else if (timestamp._seconds) {
        // Firestore Timestamp format objet
        return new Date(timestamp._seconds * 1000).toISOString();
      } else if (typeof timestamp === 'string') {
        // Déjà une string ISO
        return timestamp;
      } else {
        // Autre format de date
        return new Date(timestamp).toISOString();
      }
    } catch (error) {
      console.log('⚠️ [API] Erreur conversion timestamp:', timestamp);
      return null;
    }
  };

  return {
    id: reviewId,
    customer_name: customerName || 'Client',
    customer_avatar: data.customer_avatar || data.userAvatar || data.user_avatar || null,
    rating: data.rating || 0,
    comment: data.comment || data.review_text || '',
    merchant_response: data.merchant_response || data.merchantResponse || null,
    response_date: convertTimestamp(data.response_date || data.responseDate),
    helpful: data.helpful_count || data.helpfulCount || 0,
    created_at: convertTimestamp(data.created_at || data.createdAt) || new Date().toISOString(),
    order_id: data.order_id || data.orderId || null,
    product_name: data.product_name || data.productName || null,
  };
}

/**
 * GET /api/merchant/[merchantId]/reviews
 * Récupère tous les avis d'un marchand
 * 🔐 Protégé par App Check
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT ACTIVÉ
    const appCheckResult = await verifyAppCheckToken(request, { strict: true });
    if (appCheckResult instanceof NextResponse) {
      return appCheckResult;
    }
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    // Next.js 15: params est une Promise
    const { merchantId } = await params;
    console.log('⭐ [API] Récupération avis pour merchant:', merchantId);

    // Vérifier que le merchant existe et que l'utilisateur est le propriétaire
    const merchantRef = adminDb.collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();

    if (!merchantDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Marchand non trouvé' },
        { status: 404 }
      );
    }

    const merchantData = merchantDoc.data();
    if (merchantData?.['owner_user_id'] !== session.user.id && merchantData?.['ownerUserId'] !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // 🎯 Récupérer tous les avis depuis la sous-collection ratings (utilisée par Flutter)
    console.log('📊 [API] Récupération ratings depuis merchants/' + merchantId + '/ratings');

    let reviewsSnapshot;
    try {
      // Essayer d'abord avec orderBy
      reviewsSnapshot = await merchantRef
        .collection('ratings')
        .orderBy('created_at', 'desc')
        .get();
    } catch (orderError) {
      console.log('⚠️ [API] Erreur orderBy, récupération sans tri:', orderError);
      // Si orderBy échoue (pas d'index), récupérer sans tri
      reviewsSnapshot = await merchantRef
        .collection('ratings')
        .get();
    }

    console.log(`📦 [API] ${reviewsSnapshot.docs.length} documents trouvés dans ratings`);

    // Transformer les données Firestore (snake_case) en format Flutter (camelCase)
    // Utiliser Promise.all pour enrichir tous les avis en parallèle
    const reviews = await Promise.all(
      reviewsSnapshot.docs.map(doc =>
        transformReviewForFlutter(doc.id, doc.data())
      )
    );

    console.log(`✅ [API] ${reviews.length} avis récupérés et transformés avec noms clients`);

    return NextResponse.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération avis:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération des avis' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchant/[merchantId]/reviews/[reviewId]/respond
 * Répond à un avis
 * 🔐 Protégé par App Check avec protection contre le rejeu
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT + PROTECTION REJEU ACTIVÉS
    const appCheckResult = await verifyAppCheckToken(request, { 
      strict: true,
      consumeToken: true // Protection contre le rejeu pour les réponses
    });
    if (appCheckResult instanceof NextResponse) {
      return appCheckResult;
    }
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const { merchantId } = params;
    const body = await request.json();
    const { reviewId, response } = body;

    if (!reviewId || !response) {
      return NextResponse.json(
        { success: false, message: 'Données manquantes' },
        { status: 400 }
      );
    }

    console.log('💬 [API] Réponse à l\'avis:', reviewId);

    // Vérifier que le merchant existe et que l'utilisateur est le propriétaire
    const merchantRef = adminDb.collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();

    if (!merchantDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Marchand non trouvé' },
        { status: 404 }
      );
    }

    const merchantData = merchantDoc.data();
    if (merchantData?.['owner_user_id'] !== session.user.id && merchantData?.['ownerUserId'] !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Mettre à jour l'avis avec la réponse (collection ratings utilisée par Flutter)
    const reviewRef = merchantRef.collection('ratings').doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Avis non trouvé' },
        { status: 404 }
      );
    }

    await reviewRef.update({
      merchant_response: response,
      response_date: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    console.log('✅ [API] Réponse enregistrée');

    return NextResponse.json({
      success: true,
      message: 'Réponse enregistrée avec succès',
    });
  } catch (error) {
    console.error('❌ [API] Erreur enregistrement réponse:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'enregistrement de la réponse' },
      { status: 500 }
    );
  }
}

