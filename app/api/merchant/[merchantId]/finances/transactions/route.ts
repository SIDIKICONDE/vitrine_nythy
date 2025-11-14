import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { COMMISSION_ENABLED, COMMISSION_RATE } from '../config';

/**
 * GET /api/merchant/[merchantId]/finances/transactions
 * Récupère les transactions financières d'un marchand
 * 🔐 Protégé par App Check
 */
const parseFirestoreDate = (value: any): Date | null => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      const parsed = value.toDate();
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if ('seconds' in value && typeof value.seconds === 'number') {
      const parsed = new Date(value.seconds * 1000);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
  }

  return null;
};

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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const type = searchParams.get('type'); // 'revenue', 'commission', 'payout'
    const status = searchParams.get('status'); // 'pending', 'completed', 'failed'

    console.log('💳 [API] Récupération transactions pour merchant:', merchantId);

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

    // Récupérer les commandes comme transactions
    let query = adminDb
      .collection('orders')
      .where('merchantId', '==', merchantId)
      .orderBy('created_at', 'desc');

    // Filtrer par statut si spécifié
    if (status) {
      query = query.where('status', '==', status);
    }

    const ordersSnapshot = await query.limit(limit).offset(offset).get();

    // Convertir les commandes en transactions
    const transactions = ordersSnapshot.docs.map(doc => {
      const order = doc.data();
      const orderTotal = order['total'] || 0;

      // Calculer la commission selon la configuration
      const commission = COMMISSION_ENABLED ? orderTotal * COMMISSION_RATE : 0;
      const netAmount = orderTotal - commission;

      const createdAtDate =
        parseFirestoreDate(order['created_at'] || order['createdAt']) ||
        (doc.createTime ? parseFirestoreDate(doc.createTime.toDate()) : null);

      const completedAtDate =
        parseFirestoreDate(order['completed_at'] || order['completedAt']) ||
        (doc.updateTime ? parseFirestoreDate(doc.updateTime.toDate()) : null);

      return {
        id: doc.id,
        merchantId: order['merchantId'],
        orderId: doc.id,
        type: 'revenue',
        status: order['status'] === 'completed' ? 'completed' :
          order['status'] === 'pending' ? 'pending' : 'failed',
        amount: {
          amountMinor: Math.round(orderTotal * 100),
          currencyCode: 'EUR'
        },
        fee: {
          amountMinor: Math.round(commission * 100),
          currencyCode: 'EUR'
        },
        netAmount: {
          amountMinor: Math.round(netAmount * 100),
          currencyCode: 'EUR'
        },
        description: `Commande ${order['order_number'] || doc.id}`,
        createdAt: createdAtDate ? createdAtDate.toISOString() : null,
        completedAt: completedAtDate ? completedAtDate.toISOString() : null,
      };
    });

    // Filtrer par type si spécifié (après conversion)
    const filteredTransactions = type
      ? transactions.filter(t => t.type === type)
      : transactions;

    console.log(`✅ [API] ${filteredTransactions.length} transactions récupérées`);

    return NextResponse.json({
      success: true,
      transactions: filteredTransactions,
      total: filteredTransactions.length,
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération transactions:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération des transactions' },
      { status: 500 }
    );
  }
}

