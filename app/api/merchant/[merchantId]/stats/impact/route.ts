import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/merchant/[merchantId]/stats/impact
 * Récupère les statistiques d'impact anti-gaspillage d'un marchand
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
    console.log('🌱 [API] Récupération stats impact pour merchant:', merchantId);

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

    // Récupérer toutes les commandes complétées
    const ordersSnapshot = await adminDb
      .collection('orders')
      .where('merchantId', '==', merchantId)
      .where('status', '==', 'completed')
      .get();

    // Calculer les statistiques d'impact
    let totalItemsSaved = 0;
    let totalCO2Saved = 0;
    let totalMoneyDistributed = 0;
    const customerIds = new Set<string>();

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      const items = order['items'] || order['order_items'] || [];

      items.forEach((item: any) => {
        const quantity = item['quantity'] || 1;
        totalItemsSaved += quantity;

        // Estimation CO2: 1kg de nourriture = 2.5kg CO2
        // Estimation: 1 item = 0.5kg en moyenne
        const kgSaved = quantity * 0.5;
        totalCO2Saved += kgSaved * 2.5;
      });

      // Argent distribué (revenu total)
      const orderTotal = order['total'] || order['total_amount'] || 0;
      totalMoneyDistributed += orderTotal;

      // Clients
      const customerId = order['customer_id'] || order['customerId'] || '';
      if (customerId) {
        customerIds.add(customerId);
      }
    });

    // Calculer le score d'impact (0-100)
    // Basé sur: items sauvés, CO2 économisé, clients servis
    const itemsScore = Math.min(totalItemsSaved / 100, 1) * 40; // Max 40 points
    const co2Score = Math.min(totalCO2Saved / 1000, 1) * 30; // Max 30 points (1 tonne = 100%)
    const customersScore = Math.min(customerIds.size / 50, 1) * 30; // Max 30 points
    const impactScore = Math.round(itemsScore + co2Score + customersScore);

    const stats = {
      merchantId,
      totalItemsSaved,
      totalCO2Saved: Math.round(totalCO2Saved * 100) / 100, // Arrondir à 2 décimales
      totalMoneyDistributed: Math.round(totalMoneyDistributed * 100), // En centimes
      totalCustomers: customerIds.size,
      impactScore: Math.min(impactScore, 100), // Max 100
      generatedAt: new Date().toISOString(),
    };

    console.log(`✅ [API] Stats impact récupérées: ${totalItemsSaved} items, ${totalCO2Saved.toFixed(2)}kg CO2`);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération stats impact:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération des statistiques d\'impact' },
      { status: 500 }
    );
  }
}

