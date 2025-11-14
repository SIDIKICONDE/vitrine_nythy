import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/merchant/[merchantId]/finances/payouts
 * Récupère l'historique des versements d'un marchand
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

    const { merchantId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('💸 [API] Récupération versements pour merchant:', merchantId);

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

    // Récupérer les versements depuis la collection payouts
    // Note: Si aucun versement n'existe, on retourne un tableau vide
    // Les versements seront créés automatiquement par un processus backend quand il y aura des revenus
    let payoutsSnapshot;

    try {
      payoutsSnapshot = await adminDb
        .collection('payouts')
        .where('merchantId', '==', merchantId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .get();
    } catch (error: any) {
      // Si l'index n'existe pas encore, essayer sans orderBy
      console.warn('⚠️ [API] Index manquant pour payouts, tentative sans orderBy...');
      try {
        payoutsSnapshot = await adminDb
          .collection('payouts')
          .where('merchantId', '==', merchantId)
          .limit(limit)
          .offset(offset)
          .get();
      } catch (err) {
        console.error('❌ [API] Erreur récupération payouts:', err);
        // Retourner un tableau vide plutôt que de planter
        payoutsSnapshot = { empty: true, docs: [] } as any;
      }
    }

    const payouts = payoutsSnapshot.empty
      ? []
      : payoutsSnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
        id: doc.id,
        ...doc.data()
      }));

    console.log(`✅ [API] ${payouts.length} versements récupérés`);

    return NextResponse.json({
      success: true,
      payouts,
      total: payouts.length,
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération versements:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération des versements' },
      { status: 500 }
    );
  }
}

