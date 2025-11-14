import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

/**
 * GET /api/merchant/debug
 * Endpoint de débogage pour vérifier l'état de l'authentification et des données
 */
export async function GET() {
  try {
    console.log('🔍 [DEBUG] Début diagnostic...');

    // 1. Vérifier la session
    const session = await auth();
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        hasUser: !!session?.user,
        userId: session?.user?.id || null,
        userEmail: session?.user?.email || null,
        userName: session?.user?.name || null,
      },
      merchant: null,
      firestore: null,
      errors: [],
    };

    if (!session?.user?.id) {
      debugInfo.errors.push('Utilisateur non authentifié - pas de session valide');
      return NextResponse.json({
        success: false,
        message: 'Utilisateur non authentifié',
        debug: debugInfo,
      });
    }

    const userId = session.user.id;

    // 2. Vérifier le document users
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      debugInfo.firestore = {
        userDocExists: userDoc.exists,
        userData: userDoc.exists ? userDoc.data() : null,
      };
    } catch (error) {
      debugInfo.errors.push(`Erreur Firestore users: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 3. Chercher le merchant via owner_user_id
    try {
      const merchantsSnapshot = await adminDb
        .collection('merchants')
        .where('owner_user_id', '==', userId)
        .limit(1)
        .get();

      if (!merchantsSnapshot.empty && merchantsSnapshot.docs[0]) {
        const merchantDoc = merchantsSnapshot.docs[0];
        const merchantData = merchantDoc.data();
        
        debugInfo.merchant = {
          found: true,
          id: merchantDoc.id,
          name: merchantData?.['name'] || merchantData?.['business_name'],
          owner_user_id: merchantData?.['owner_user_id'],
          ownerUserId: merchantData?.['ownerUserId'],
          email: merchantData?.['email'] || merchantData?.['contact_email'],
        };
      } else {
        // Essayer avec ownerUserId
        const merchantsSnapshot2 = await adminDb
          .collection('merchants')
          .where('ownerUserId', '==', userId)
          .limit(1)
          .get();

        if (!merchantsSnapshot2.empty && merchantsSnapshot2.docs[0]) {
          const merchantDoc = merchantsSnapshot2.docs[0];
          const merchantData = merchantDoc.data();
          
          debugInfo.merchant = {
            found: true,
            foundVia: 'ownerUserId',
            id: merchantDoc.id,
            name: merchantData?.['name'] || merchantData?.['business_name'],
            owner_user_id: merchantData?.['owner_user_id'],
            ownerUserId: merchantData?.['ownerUserId'],
            email: merchantData?.['email'] || merchantData?.['contact_email'],
          };
        } else {
          debugInfo.merchant = {
            found: false,
            searchedWith: [
              { field: 'owner_user_id', value: userId },
              { field: 'ownerUserId', value: userId },
            ],
          };
          debugInfo.errors.push('Aucun merchant trouvé pour cet utilisateur');
        }
      }
    } catch (error) {
      debugInfo.errors.push(`Erreur recherche merchant: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 4. Tester l'accès à la collection orders si merchant trouvé
    if (debugInfo.merchant?.found && debugInfo.merchant?.id) {
      try {
        const ordersSnapshot = await adminDb
          .collection('orders')
          .where('merchantId', '==', debugInfo.merchant.id)
          .limit(5)
          .get();

        debugInfo.merchant.ordersCount = ordersSnapshot.size;
        debugInfo.merchant.sampleOrders = ordersSnapshot.docs.map(doc => ({
          id: doc.id,
          status: doc.data()?.['status'],
          total: doc.data()?.['total'],
          created_at: doc.data()?.['created_at'],
        }));
      } catch (error) {
        debugInfo.errors.push(`Erreur lecture orders: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erreur:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors du diagnostic',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

