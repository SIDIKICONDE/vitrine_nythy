import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { Timestamp } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/merchant/[merchantId]/stats/sales
 * Récupère les statistiques de ventes d'un marchand
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
    const period = (searchParams.get('period') || 'monthly') as 'daily' | 'weekly' | 'monthly' | 'yearly';

    console.log('📊 [API] Récupération stats ventes pour merchant:', merchantId, 'période:', period);

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

    // Calculer les dates selon la période
    const now = new Date();
    let startDate: Date;
    const endDate = now;

    switch (period) {
      case 'daily':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'yearly':
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Récupérer TOUTES les commandes complétées du marchand (pas de filtre par date)
    // On filtrera en mémoire car Firestore ne permet qu'un seul index de range query
    console.log('🔍 [API] Recherche commandes entre', startDate.toISOString(), 'et', endDate.toISOString());
    
    const ordersSnapshot = await adminDb
      .collection('orders')
      .where('merchantId', '==', merchantId)
      .where('status', '==', 'completed')
      .get();
    
    console.log(`📦 [API] ${ordersSnapshot.size} commandes complétées trouvées (total), filtrage par date en cours...`);

    // Récupérer les produits
    const productsSnapshot = await merchantRef.collection('products').get();

    // Calculer les statistiques
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalItemsSold = 0;
    let totalItemsSaved = 0;
    const revenueByDay: Record<string, { revenue: number; orders: number }> = {};
    const productSales: Record<string, { quantity: number; revenue: number; name: string }> = {};
    const customerIds = new Set<string>();
    const returningCustomers = new Set<string>();

    ordersSnapshot.forEach(doc => {
      const order = doc.data();
      
      // Filtrer par date en mémoire
      const createdAtRaw = order['created_at'] || order['createdAt'];
      if (!createdAtRaw) return; // Ignorer si pas de date
      
      let orderDate: Date;
      if (createdAtRaw.toDate && typeof createdAtRaw.toDate === 'function') {
        // Firestore Timestamp
        orderDate = createdAtRaw.toDate();
      } else if (createdAtRaw._seconds) {
        // Firestore Timestamp format objet
        orderDate = new Date(createdAtRaw._seconds * 1000);
      } else {
        // String ISO ou autre
        orderDate = new Date(createdAtRaw);
      }
      
      // Vérifier si la commande est dans la période
      if (orderDate < startDate || orderDate > endDate) {
        return; // Ignorer les commandes hors période
      }
      
      totalOrders++;
      const orderTotal = order['total'] || order['total_amount'] || 0;
      totalRevenue += orderTotal;

      // Items vendus
      const items = order['items'] || order['order_items'] || [];
      items.forEach((item: any) => {
        const quantity = item['quantity'] || 1;
        totalItemsSold += quantity;
        totalItemsSaved += quantity; // Pour l'instant, on considère que tous les items sont sauvés

        // Statistiques par produit
        const productId = item['product_id'] || item['productId'] || '';
        if (productId) {
          if (!productSales[productId]) {
            const productDoc = productsSnapshot.docs.find(p => p.id === productId);
            const productData = productDoc?.data();
            productSales[productId] = {
              quantity: 0,
              revenue: 0,
              name: productData?.['name'] || productData?.['title'] || 'Produit inconnu',
            };
          }
          const productSale = productSales[productId];
          if (productSale) {
            productSale.quantity += quantity;
            productSale.revenue += (item['price'] || item['unit_price'] || 0) * quantity;
          }
        }
      });

      // Clients
      const customerId = order['customer_id'] || order['customerId'] || '';
      if (customerId) {
        if (customerIds.has(customerId)) {
          returningCustomers.add(customerId);
        }
        customerIds.add(customerId);
      }

      // Revenu par jour (utiliser orderDate déjà calculé)
      const dateKey: string = orderDate.toISOString().split('T')[0] as string;
      if (!revenueByDay[dateKey]) {
        revenueByDay[dateKey] = { revenue: 0, orders: 0 };
      }
      const dayData = revenueByDay[dateKey];
      if (dayData) {
        dayData.revenue += orderTotal;
        dayData.orders += 1;
      }
    });

    // Top produits
    const topSellingProducts = Object.entries(productSales)
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantitySold: data.quantity,
        revenue: {
          amountMinor: Math.round(data.revenue * 100), // Convertir en centimes
          currencyCode: 'EUR',
        },
      }))
      .sort((a, b) => b.revenue.amountMinor - a.revenue.amountMinor)
      .slice(0, 10);

    // Calculer les moyennes
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const conversionRate = 0; // À calculer si on a des données de visiteurs

    // Revenu par jour formaté
    const revenueByDayArray = Object.entries(revenueByDay)
      .map(([date, data]) => ({
        date: new Date(date).toISOString(),
        revenue: {
          amountMinor: Math.round(data.revenue * 100),
          currencyCode: 'EUR',
        },
        orders: data.orders,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const stats = {
      merchantId,
      period,
      totalRevenue: {
        amountMinor: Math.round(totalRevenue * 100), // Convertir en centimes
        currencyCode: 'EUR',
      },
      totalOrders,
      averageOrderValue: {
        amountMinor: Math.round(averageOrderValue * 100),
        currencyCode: 'EUR',
      },
      totalItemsSold,
      totalItemsSaved,
      conversionRate,
      returningCustomers: returningCustomers.size,
      newCustomers: customerIds.size - returningCustomers.size,
      topSellingProducts,
      revenueByDay: revenueByDayArray,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      generatedAt: new Date().toISOString(),
    };

    console.log(`✅ [API] Stats ventes récupérées: ${totalOrders} commandes (sur ${ordersSnapshot.size} totales), ${totalRevenue.toFixed(2)}€`);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération stats ventes:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération des statistiques de ventes' },
      { status: 500 }
    );
  }
}

