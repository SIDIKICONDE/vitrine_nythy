import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Transforme une commande Firestore (snake_case) en format Flutter (camelCase)
 */
function transformOrderForFlutter(orderId: string, data: any) {
  return {
    id: orderId,
    merchantId: data.merchantId || data.merchant_id,
    customerId: data.customerId || data.customer_id,
    customerName: data.customerName || data.customer_name || 'Client inconnu',
    customerEmail: data.customerEmail || data.customer_email || null,
    customerPhone: data.customerPhone || data.customer_phone || null,
    orderNumber: data.orderNumber || data.order_number || `#${orderId.slice(0, 8)}`,
    status: data.status || 'pending',
    items: data.items || [],
    totalAmount: data.totalAmount || data.total_amount || data.total || 0,
    subtotal: data.subtotal || data.sub_total || null,
    taxAmount: data.taxAmount || data.tax_amount || null,
    discountAmount: data.discountAmount || data.discount_amount || null,
    pickupTime: data.pickupTime || data.pickup_time || null,
    pickupCode: data.pickupCode || data.pickup_code || null,
    pickupInstructions: data.pickupInstructions || data.pickup_instructions || null,
    paymentMethod: data.paymentMethod || data.payment_method || null,
    paymentStatus: data.paymentStatus || data.payment_status || 'pending',
    notes: data.notes || null,
    createdAt: data.createdAt || data.created_at,
    updatedAt: data.updatedAt || data.updated_at,
    completedAt: data.completedAt || data.completed_at || null,
    cancelledAt: data.cancelledAt || data.cancelled_at || null,
    confirmedAt: data.confirmedAt || data.confirmed_at || null,
    readyAt: data.readyAt || data.ready_at || null,
    cancellationReason: data.cancellationReason || data.cancellation_reason || null,
  };
}

/**
 * GET /api/merchant/[merchantId]/orders/[orderId]
 * Récupère une commande spécifique
 * 🔐 Protégé par App Check
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; orderId: string }> }
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

    const { merchantId, orderId } = await params;

    console.log('🛒 [API] Récupération commande:', orderId);

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

    // Récupérer la commande
    const orderDoc = await adminDb.collection('orders').doc(orderId).get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    // Vérifier que la commande appartient bien à ce marchand
    if (orderData?.['merchantId'] !== merchantId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Transformer les données pour Flutter
    const order = transformOrderForFlutter(orderDoc.id, orderData);

    console.log('✅ [API] Commande récupérée');

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération commande:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/merchant/[merchantId]/orders/[orderId]
 * Met à jour le statut d'une commande
 * 🔐 Protégé par App Check avec protection contre le rejeu
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; orderId: string }> }
) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT + PROTECTION REJEU ACTIVÉS
    const appCheckResult = await verifyAppCheckToken(request, { 
      strict: true,
      consumeToken: true // Protection contre le rejeu pour les mises à jour
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

    const { merchantId, orderId } = await params;
    const updates = await request.json();

    console.log('📝 [API] Mise à jour commande:', orderId, updates);

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

    // Récupérer la commande
    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Commande non trouvée' },
        { status: 404 }
      );
    }

    const orderData = orderDoc.data();

    // Vérifier que la commande appartient bien à ce marchand
    if (orderData?.['merchantId'] !== merchantId) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Valider le statut
    const validStatuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'];
    if (updates.status && !validStatuses.includes(updates.status)) {
      return NextResponse.json(
        { success: false, message: 'Statut invalide' },
        { status: 400 }
      );
    }

    // Préparer les mises à jour
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status) {
      updateData.status = updates.status;

      // Ajouter des timestamps selon le statut
      if (updates.status === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (updates.status === 'ready') {
        updateData.ready_at = new Date().toISOString();
      } else if (updates.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (updates.status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
        if (updates.cancellationReason) {
          updateData.cancellation_reason = updates.cancellationReason;
        }
      }
    }

    // Mettre à jour la commande
    await orderRef.update(updateData);

    console.log('✅ [API] Commande mise à jour');

    return NextResponse.json({
      success: true,
      message: 'Commande mise à jour avec succès',
    });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour commande:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la mise à jour de la commande' },
      { status: 500 }
    );
  }
}

