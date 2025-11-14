import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Convertit un Timestamp Firestore en Date ISO string
 */
function convertTimestamp(timestamp: any): string | null {
  if (!timestamp) return null;
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toISOString();
  }
  if (timestamp.seconds) {
    return new Date(timestamp.seconds * 1000).toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  if (typeof timestamp === 'string') {
    return timestamp;
  }
  return null;
}

/**
 * Normalise le statut de la commande
 */
function normalizeStatus(status: any): string {
  if (!status) return 'pending';
  const statusStr = String(status).toLowerCase();
  // Mapper les statuts possibles
  if (statusStr === 'confirmed' || statusStr === 'confirmé') return 'confirmed';
  if (statusStr === 'ready_for_pickup' || statusStr === 'ready') return 'ready';
  if (statusStr === 'picked_up' || statusStr === 'completed') return 'completed';
  if (statusStr === 'canceled' || statusStr === 'cancelled') return 'cancelled';
  return statusStr || 'pending';
}

/**
 * Transforme une commande Firestore (snake_case) en format Flutter (camelCase)
 */
function transformOrderForFlutter(orderId: string, data: any) {
  // Normaliser le montant (peut être en centimes ou en euros)
  const amount = data.amount || data.totalAmount || data.total_amount || data.total || 0;
  const totalAmount = amount > 1000 ? amount / 100 : amount; // Si > 1000, probablement en centimes

  return {
    id: orderId,
    merchantId: data.merchantId || data.merchant_id,
    customerId: data.customerId || data.customer_id || data.userId,
    customerName: data.customerName || data.customer_name || 'Client inconnu',
    customerEmail: data.customerEmail || data.customer_email || null,
    customerPhone: data.customerPhone || data.customer_phone || null,
    orderNumber: data.orderNumber || data.order_number || `#${orderId.slice(0, 8)}`,
    status: normalizeStatus(data.status),
    items: data.items || [],
    total: totalAmount,
    totalAmount: totalAmount,
    subtotal: data.subtotal || data.sub_total || null,
    taxAmount: data.taxAmount || data.tax_amount || null,
    discountAmount: data.discountAmount || data.discount_amount || null,
    pickupTime: convertTimestamp(data.pickupTime || data.pickup_time),
    pickupCode: data.pickupCode || data.pickup_code || null,
    pickupInstructions: data.pickupInstructions || data.pickup_instructions || null,
    paymentMethod: data.paymentMethod || data.payment_method || null,
    paymentStatus: data.paymentStatus || data.payment_status || 'pending',
    notes: data.notes || null,
    created_at: convertTimestamp(data.createdAt || data.created_at),
    createdAt: convertTimestamp(data.createdAt || data.created_at),
    updated_at: convertTimestamp(data.updatedAt || data.updated_at),
    updatedAt: convertTimestamp(data.updatedAt || data.updated_at),
    completed_at: convertTimestamp(data.completedAt || data.completed_at),
    completedAt: convertTimestamp(data.completedAt || data.completed_at),
    cancelled_at: convertTimestamp(data.cancelledAt || data.cancelled_at),
    cancelledAt: convertTimestamp(data.cancelledAt || data.cancelled_at),
  };
}

/**
 * GET /api/merchant/[merchantId]/orders
 * Récupère toutes les commandes d'un marchand
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

    console.log('🛒 [API] Récupération commandes pour merchant:', merchantId);

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

    // Récupérer toutes les commandes
    // Note: Dans Firestore, les commandes sont dans la collection 'orders' avec un champ 'merchantId'

    // D'abord, vérifier s'il y a des commandes dans la collection (sans filtre)
    const allOrdersSnapshot = await adminDb.collection('orders').limit(5).get();
    console.log(`🔍 [API] Total commandes dans Firestore (échantillon): ${allOrdersSnapshot.docs.length}`);
    if (allOrdersSnapshot.docs.length > 0) {
      console.log('📋 [API] Exemples de merchantId dans les commandes:',
        allOrdersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            merchantId: data['merchantId'] || data['merchant_id'],
            status: data['status'],
          };
        })
      );
    }

    // Essayer d'abord avec created_at, puis avec createdAt si ça échoue
    let ordersSnapshot;
    try {
      console.log('🔍 [API] Tentative récupération avec created_at pour merchantId:', merchantId);
      ordersSnapshot = await adminDb
        .collection('orders')
        .where('merchantId', '==', merchantId)
        .orderBy('created_at', 'desc')
        .get();
      console.log(`✅ [API] ${ordersSnapshot.docs.length} commandes trouvées avec created_at`);
    } catch (error: any) {
      console.log('⚠️ [API] Erreur avec created_at, essai avec createdAt:', error.message);
      // Si created_at n'existe pas, utiliser createdAt
      try {
        ordersSnapshot = await adminDb
          .collection('orders')
          .where('merchantId', '==', merchantId)
          .orderBy('createdAt', 'desc')
          .get();
        console.log(`✅ [API] ${ordersSnapshot.docs.length} commandes trouvées avec createdAt`);
      } catch (error2: any) {
        console.log('⚠️ [API] Erreur avec createdAt, récupération sans orderBy:', error2.message);
        // Si aucun index n'existe, récupérer sans orderBy et trier en mémoire
        ordersSnapshot = await adminDb
          .collection('orders')
          .where('merchantId', '==', merchantId)
          .get();
        console.log(`✅ [API] ${ordersSnapshot.docs.length} commandes trouvées sans orderBy`);
      }
    }

    // Si toujours 0, essayer avec merchant_id (snake_case)
    if (ordersSnapshot.docs.length === 0) {
      console.log('🔍 [API] Aucune commande trouvée avec merchantId, essai avec merchant_id...');
      try {
        const altSnapshot = await adminDb
          .collection('orders')
          .where('merchant_id', '==', merchantId)
          .get();
        console.log(`✅ [API] ${altSnapshot.docs.length} commandes trouvées avec merchant_id`);
        if (altSnapshot.docs.length > 0) {
          ordersSnapshot = altSnapshot;
        }
      } catch (error3: any) {
        console.log('⚠️ [API] Erreur avec merchant_id:', error3.message);
      }
    }

    // Transformer les données Firestore (snake_case) en format Flutter (camelCase)
    let orders = ordersSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`📦 [API] Commande ${doc.id}:`, {
        merchantId: data['merchantId'] || data['merchant_id'],
        status: data['status'],
        customerName: data['customerName'] || data['customer_name'],
        hasItems: !!data['items'],
      });
      return transformOrderForFlutter(doc.id, data);
    });

    // Trier en mémoire par date de création (descendant)
    orders.sort((a, b) => {
      const getDate = (order: any) => {
        const dateStr = order.createdAt || order.created_at;
        if (dateStr) {
          try {
            return new Date(dateStr).getTime();
          } catch {
            return 0;
          }
        }
        return 0;
      };
      return getDate(b) - getDate(a); // Descendant
    });

    console.log(`✅ [API] ${orders.length} commandes transformées et triées`);

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération commandes:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    );
  }
}

