import { adminDb } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/merchant/[merchantId]/dashboard
 * Récupère toutes les données du dashboard pour un marchand
 * 🔐 Protégé par App Check
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT ACTIVÉ
    const appCheckResult = await verifyAppCheckToken(request, { strict: true });
    if (appCheckResult instanceof NextResponse) {
      return appCheckResult;
    }
    const { merchantId } = params;

    if (!merchantId) {
      return NextResponse.json(
        { success: false, message: 'merchantId manquant' },
        { status: 400 }
      );
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const lastMonthStart = new Date(now);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

    const merchantRef = adminDb.collection('merchants').doc(merchantId);

    // Récupérer toutes les commandes
    const allOrdersSnapshot = await adminDb
      .collection('orders')
      .where('merchantId', '==', merchantId)
      .get();

    // Récupérer les produits
    const productsSnapshot = await merchantRef.collection('products').get();

    // Calculer les statistiques
    let totalRevenue = 0;
    let todayRevenue = 0;
    let totalOrders = 0;
    let pendingOrders = 0;
    let completedOrders = 0;
    const recentOrders: any[] = [];
    const productSales: Record<string, { sales: number; revenue: number }> = {};

    allOrdersSnapshot.docs.forEach(doc => {
      const order = doc.data();
      const orderTotal = order['total'] || 0;
      const orderDate = new Date(order['created_at']);
      const status = order['status'];

      totalOrders++;

      if (status === 'pending' || status === 'confirmed') {
        pendingOrders++;
      }

      if (status === 'completed') {
        completedOrders++;
        totalRevenue += orderTotal;

        if (orderDate >= todayStart) {
          todayRevenue += orderTotal;
        }

        // Calcul des ventes par produit
        const items = order['items'] || [];
        items.forEach((item: any) => {
          const productId: string | undefined = item['productId'] || item['product_id'];
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = { sales: 0, revenue: 0 };
            }
            productSales[productId]!.sales += item['quantity'] || 1;
            productSales[productId]!.revenue += item['price'] * (item['quantity'] || 1);
          }
        });
      }

      // Commandes récentes
      if (recentOrders.length < 10) {
        const orderItems = order['items'] || order['products'] || [];
        const itemCount = Array.isArray(orderItems) 
          ? orderItems.reduce((sum: number, item: any) => sum + (item['quantity'] || 1), 0)
          : 0;

        recentOrders.push({
          id: doc.id,
          orderNumber: order['order_number'] || order['orderNumber'] || `#${doc.id.slice(0, 8)}`,
          customerName: order['customer_name'] || order['customerName'] || 'Client inconnu',
          items: itemCount,
          total: orderTotal,
          status: status,
          createdAt: order['created_at'],
        });
      }
    });

    recentOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Produits actifs
    const activeProducts = productsSnapshot.docs.filter(doc => {
      const product = doc.data();
      return product['is_active'] !== false && product['isActive'] !== false;
    }).length;

    // Top 5 produits
    const topProducts = Object.entries(productSales)
      .map(([productId, data]) => {
        const productDoc = productsSnapshot.docs.find(doc => doc.id === productId);
        const productData = productDoc?.data();
        return {
          id: productId,
          title: productData?.['title'] || productData?.['name'] || 'Produit inconnu',
          imageUrl: productData?.['image_url'] || productData?.['imageUrl'] || undefined,
          sales: data.sales,
          revenue: data.revenue,
          rating: productData?.['rating'] || 0,
        };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    // Récupérer le document marchand pour obtenir rating_summary et stats
    const merchantDoc = await merchantRef.get();
    const merchantData = merchantDoc.data();
    
    // Récupérer la note moyenne et le nombre d'avis depuis rating_summary
    const ratingSummary = merchantData?.['rating_summary'] as { average?: number; count?: number; averageRating?: number; totalReviews?: number } | undefined;
    const averageRating = ratingSummary?.averageRating ?? ratingSummary?.average ?? 0;
    const totalReviews = ratingSummary?.totalReviews ?? ratingSummary?.count ?? 0;
    
    // 🔧 Récupérer les avis depuis la sous-collection 'ratings' (utilisée par Flutter)
    let ratingsSnapshot;
    try {
      // Essayer avec orderBy si l'index existe
      ratingsSnapshot = await merchantRef
        .collection('ratings')
        .orderBy('created_at', 'desc')
        .limit(10)
        .get();
    } catch (orderError) {
      // Sinon récupérer sans tri
      ratingsSnapshot = await merchantRef
        .collection('ratings')
        .limit(10)
        .get();
    }

    // Calculer les tendances
    const lastMonthOrders = allOrdersSnapshot.docs.filter(doc => {
      const orderDate = new Date(doc.data()['created_at']);
      return orderDate >= lastMonthStart && orderDate < todayStart;
    }).length;
    const currentMonthOrders = allOrdersSnapshot.docs.filter(doc => {
      const orderDate = new Date(doc.data()['created_at']);
      return orderDate >= todayStart;
    }).length;
    const ordersTrend = lastMonthOrders > 0
      ? Math.round(((currentMonthOrders - lastMonthOrders) / lastMonthOrders) * 100)
      : 0;

    // Revenue hebdomadaire
    const weeklyRevenue: { label: string; value: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      let weekRevenue = 0;
      allOrdersSnapshot.docs.forEach(doc => {
        const order = doc.data();
        const orderDate = new Date(order['created_at']);
        if (orderDate >= weekStart && orderDate < weekEnd && order['status'] === 'completed') {
          weekRevenue += order['total'] || 0;
        }
      });

      weeklyRevenue.push({
        label: i === 0 ? 'Cette semaine' : `Sem ${4 - i}`,
        value: Math.round(weekRevenue * 100) / 100
      });
    }

    // Activités récentes
    const activities: any[] = [];
    recentOrders.slice(0, 5).forEach(order => {
      let description = order.orderNumber;
      if (order.items > 0) {
        description += ` - ${order.items} article${order.items > 1 ? 's' : ''}`;
      }
      if (order.total > 0) {
        description += ` (${order.total.toFixed(2)} €)`;
      }

      activities.push({
        id: `order-${order.id}`,
        type: 'order',
        icon: '🛒',
        title: 'Nouvelle commande',
        description,
        timestamp: order.createdAt,
      });
    });

    // Ajouter les avis récents dans les activités
    ratingsSnapshot.docs.slice(0, 3).forEach(doc => {
      const rating = doc.data();
      const ratingValue = rating['rating'];
      
      // Ne pas afficher les avis sans note valide
      if (ratingValue === undefined || ratingValue === null || ratingValue === 0) {
        return;
      }
      
      const comment = rating['comment'] || rating['review_text'] || '';
      const description = comment.length > 0 
        ? `${ratingValue}/5 ⭐ - ${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}`
        : `${ratingValue}/5 ⭐`;
      
      // Convertir le timestamp Firestore
      let timestamp = now.toISOString();
      const createdAt = rating['created_at'];
      if (createdAt?._seconds) {
        timestamp = new Date(createdAt._seconds * 1000).toISOString();
      } else if (createdAt?.toDate) {
        timestamp = createdAt.toDate().toISOString();
      } else if (typeof createdAt === 'string') {
        timestamp = createdAt;
      }
      
      activities.push({
        id: `review-${doc.id}`,
        type: 'review',
        icon: '⭐',
        title: 'Nouvel avis',
        description,
        timestamp,
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const co2Saved = completedOrders * 0.5;
    const followersCount = merchantData?.['stats']?.['followersCount'] ||
      merchantData?.['followers_count'] || 0;

    // Retourner les données
    const dashboardData = {
      merchantId,
      stats: {
        totalOrders: completedOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        followersCount,
        productsCount: productsSnapshot.size,
        activeProducts,
        savedItemsCount: completedOrders,
        co2Saved: Math.round(co2Saved * 10) / 10,
        pendingOrders,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
      },
      trends: {
        orders: ordersTrend,
        revenue: ordersTrend,
        followers: 0,
      },
      recentOrders: recentOrders.slice(0, 5),
      topProducts,
      weeklyRevenue,
      activities: activities.slice(0, 10),
      generatedAt: now.toISOString(),
    };

    return NextResponse.json({
      success: true,
      dashboard: dashboardData,
    });
  } catch (error) {
    console.error('❌ Erreur GET dashboard:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur serveur',
      },
      { status: 500 }
    );
  }
}
