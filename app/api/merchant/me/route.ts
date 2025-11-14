import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/merchant/me
 * Récupère les informations du marchand connecté
 * 🔐 Protégé par App Check
 */
export async function GET(request: NextRequest) {
  // 🔐 Vérifier App Check - MODE STRICT ACTIVÉ
  const appCheckResult = await verifyAppCheckToken(request, { strict: true });
  if (appCheckResult instanceof NextResponse) {
    return appCheckResult;
  }
  try {
    // Vérifier l'authentification
    const session = await auth();
    if (!session?.user?.id) {
      console.log('❌ [API] Pas de session');
      return NextResponse.json(
        { success: false, message: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log('👤 [API] Récupération merchant pour user:', userId);

    // Récupérer le document users pour obtenir le merchantId
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.log('⚠️  [API] Document users non trouvé pour:', userId);

      // Chercher directement dans merchants avec owner_user_id
      console.log('🔍 [API] Recherche dans merchants avec owner_user_id...');
      const merchantsSnapshot = await adminDb
        .collection('merchants')
        .where('owner_user_id', '==', userId)
        .limit(1)
        .get();

      if (merchantsSnapshot.empty) {
        console.log('❌ [API] Aucun merchant trouvé pour owner_user_id:', userId);
        return NextResponse.json(
          { success: false, message: 'Vous devez d\'abord créer votre commerce. Veuillez vous inscrire.' },
          { status: 404 }
        );
      }

      const merchantDoc = merchantsSnapshot.docs[0];
      if (!merchantDoc) {
        console.log('❌ [API] Document merchant invalide');
        return NextResponse.json(
          { success: false, message: 'Erreur lors de la récupération du commerce' },
          { status: 500 }
        );
      }

      const merchantData = {
        id: merchantDoc.id,
        ...merchantDoc.data(),
        // Utiliser l'email de la session Firebase Auth (plus fiable)
        email: session.user.email || merchantDoc.data()?.['email'] || merchantDoc.data()?.['contact_email'],
      };

      console.log('✅ [API] Merchant trouvé via owner_user_id:', merchantDoc.id);

      return NextResponse.json({
        success: true,
        merchant: merchantData,
      });
    }

    const userData = userDoc.data();
    console.log('📄 [API] Document users trouvé:', { role: userData?.['role'], merchantId: userData?.['merchantId'] });

    let merchantId = userData?.['merchantId'];

    // Si pas de merchantId dans users, chercher dans merchants
    if (!merchantId) {
      console.log('⚠️  [API] Pas de merchantId dans users, recherche dans merchants...');
      const merchantsSnapshot = await adminDb
        .collection('merchants')
        .where('owner_user_id', '==', userId)
        .limit(1)
        .get();

      if (merchantsSnapshot.empty) {
        // Aussi chercher avec ownerUserId (autre format)
        const merchantsSnapshot2 = await adminDb
          .collection('merchants')
          .where('ownerUserId', '==', userId)
          .limit(1)
          .get();

        if (merchantsSnapshot2.empty) {
          console.log('❌ [API] Aucun commerce trouvé pour cet utilisateur');
          return NextResponse.json(
            { success: false, message: 'Vous devez d\'abord créer votre commerce. Veuillez vous inscrire.' },
            { status: 404 }
          );
        }

        const merchantDoc = merchantsSnapshot2.docs[0];
        if (!merchantDoc) {
          console.log('❌ [API] Document merchant invalide');
          return NextResponse.json(
            { success: false, message: 'Erreur lors de la récupération du commerce' },
            { status: 500 }
          );
        }

        merchantId = merchantDoc.id;
        console.log('✅ [API] Merchant trouvé via ownerUserId:', merchantId);

        // Mettre à jour le document users avec le merchantId
        await adminDb.collection('users').doc(userId).set({
          merchantId: merchantId,
        }, { merge: true });
        console.log('✅ [API] Document users mis à jour avec merchantId');
      } else {
        const merchantDoc = merchantsSnapshot.docs[0];
        if (!merchantDoc) {
          console.log('❌ [API] Document merchant invalide');
          return NextResponse.json(
            { success: false, message: 'Erreur lors de la récupération du commerce' },
            { status: 500 }
          );
        }

        merchantId = merchantDoc.id;
        console.log('✅ [API] Merchant trouvé via owner_user_id:', merchantId);

        // Mettre à jour le document users avec le merchantId
        await adminDb.collection('users').doc(userId).set({
          merchantId: merchantId,
        }, { merge: true });
        console.log('✅ [API] Document users mis à jour avec merchantId');
      }
    }

    // Récupérer les informations du merchant
    const merchantDoc = await adminDb.collection('merchants').doc(merchantId).get();

    if (!merchantDoc.exists) {
      console.log('❌ [API] Document merchant non trouvé:', merchantId);
      return NextResponse.json(
        { success: false, message: 'Commerce non trouvé. Veuillez contacter le support.' },
        { status: 404 }
      );
    }

    const merchantData = {
      id: merchantDoc.id,
      ...merchantDoc.data(),
      // Utiliser l'email de la session Firebase Auth (plus fiable)
      email: session.user.email || merchantDoc.data()?.['email'] || merchantDoc.data()?.['contact_email'],
    };

    console.log('✅ [API] Merchant récupéré:', merchantId);

    return NextResponse.json({
      success: true,
      merchant: merchantData,
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération merchant:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération du commerce' },
      { status: 500 }
    );
  }
}

