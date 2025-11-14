import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/merchant/[merchantId]/customers
 * Récupère tous les clients d'un marchand (basé sur les commandes)
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
    console.log('👥 [API] Récupération clients pour merchant:', merchantId);

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

    // Récupérer toutes les commandes du marchand
    const ordersSnapshot = await adminDb
      .collection('orders')
      .where('merchantId', '==', merchantId)
      .get();

    // Agréger les données des clients depuis les commandes
    const customersMap = new Map<string, any>();

    // 🎯 Fonction helper pour récupérer le nom du client depuis profiles/users
    const fetchCustomerName = async (customerId: string, orderCustomerName?: string): Promise<string> => {
      // Si le nom est déjà dans la commande, l'utiliser
      if (orderCustomerName && orderCustomerName !== 'Client inconnu') {
        return orderCustomerName;
      }

      if (!customerId) return 'Client inconnu';

      try {
        // Essayer depuis profiles
        const profileDoc = await adminDb.collection('profiles').doc(customerId).get();
        if (profileDoc.exists) {
          const profileData = profileDoc.data();
          const name = profileData?.['displayName'] || profileData?.['display_name'];
          if (name) return name;
        }

        // Si toujours pas, essayer depuis users
        const userDoc = await adminDb.collection('users').doc(customerId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          const name = userData?.['displayName'] || userData?.['display_name'] || userData?.['email']?.split('@')[0];
          if (name) return name;
        }
      } catch (error) {
        console.log('⚠️ [API] Impossible de récupérer le nom pour userId:', customerId);
      }

      return 'Client inconnu';
    };

    // Collecter tous les clients depuis les commandes
    ordersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      const customerId = order['customer_id'] || order['customerId'];
      const customerName = order['customer_name'] || order['customerName'];
      const customerEmail = order['customer_email'] || order['customerEmail'] || '';
      const orderTotal = order['total'] || 0;
      const orderStatus = order['status'];

      // Convertir Firestore Timestamp en Date
      let orderDate = new Date();
      const createdAt = order['created_at'] || order['createdAt'];
      if (createdAt) {
        if (createdAt.toDate && typeof createdAt.toDate === 'function') {
          // Firestore Timestamp
          orderDate = createdAt.toDate();
        } else if (createdAt._seconds) {
          // Firestore Timestamp format objet
          orderDate = new Date(createdAt._seconds * 1000);
        } else {
          // String ISO ou autre
          orderDate = new Date(createdAt);
        }
      }

      // Si le client n'existe pas encore dans la map
      if (!customersMap.has(customerId)) {
        customersMap.set(customerId, {
          id: customerId,
          name: customerName || 'Client inconnu', // Temporaire, sera enrichi
          email: customerEmail,
          totalOrders: 0,
          totalSpent: 0,
          completedOrders: 0,
          lastOrderDate: orderDate,
          firstOrderDate: orderDate,
          needsEnrichment: !customerName || customerName === 'Client inconnu',
        });
      }

      const customer = customersMap.get(customerId);

      // Mettre à jour les stats
      customer.totalOrders += 1;

      if (orderStatus === 'completed') {
        customer.completedOrders += 1;
        customer.totalSpent += orderTotal;
      }

      // Mettre à jour les dates
      if (orderDate > customer.lastOrderDate) {
        customer.lastOrderDate = orderDate;
      }
      if (orderDate < customer.firstOrderDate) {
        customer.firstOrderDate = orderDate;
      }
    });

    // 🎯 Enrichir les noms des clients qui n'en ont pas
    console.log(`🔍 [API] Enrichissement des noms pour ${customersMap.size} clients...`);
    const enrichmentPromises = Array.from(customersMap.entries())
      .filter(([_, customer]) => customer.needsEnrichment)
      .map(async ([customerId, customer]) => {
        const enrichedName = await fetchCustomerName(customerId, customer.name);
        customer.name = enrichedName;
        delete customer.needsEnrichment;
      });

    await Promise.all(enrichmentPromises);
    console.log(`✅ [API] Enrichissement terminé`);


    // Convertir en array et déterminer les clients VIP
    const customers = Array.from(customersMap.values()).map(customer => {
      // Un client est VIP s'il a plus de 5 commandes complétées ou plus de 100€ dépensés
      const isVIP = customer.completedOrders >= 5 || customer.totalSpent >= 100;

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalOrders: customer.totalOrders,
        completedOrders: customer.completedOrders,
        totalSpent: Math.round(customer.totalSpent * 100) / 100,
        lastOrderDate: customer.lastOrderDate.toISOString(),
        firstOrderDate: customer.firstOrderDate.toISOString(),
        isVIP,
      };
    });

    // Trier par date de dernière commande (plus récents d'abord)
    customers.sort((a, b) =>
      new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime()
    );

    console.log(`✅ [API] ${customers.length} clients récupérés`);

    return NextResponse.json({
      success: true,
      customers,
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération clients:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération des clients' },
      { status: 500 }
    );
  }
}

