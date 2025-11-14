import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import DashboardContent from '@/app/merchant/dashboard/DashboardContent';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Dashboard - Espace Marchand',
};

/**
 * Récupère le merchantId de l'utilisateur connecté
 */
async function getMerchantId(userId: string): Promise<string | null> {
  try {
    // Récupérer le document users pour obtenir le merchantId
    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      // Chercher directement dans merchants avec owner_user_id
      const merchantsSnapshot = await adminDb
        .collection('merchants')
        .where('owner_user_id', '==', userId)
        .limit(1)
        .get();

      if (merchantsSnapshot.empty || !merchantsSnapshot.docs[0]) {
        return null;
      }

      return merchantsSnapshot.docs[0].id;
    }

    const userData = userDoc.data();
    return userData?.['merchantId'] || userData?.['merchant_id'] || null;
  } catch (error) {
    console.error('❌ Erreur getMerchantId:', error);
    return null;
  }
}

/**
 * Récupère les données du dashboard côté serveur
 */
async function getDashboardData(merchantId: string) {
  try {
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

    console.log('🔍 getDashboardData - Nombre de commandes trouvées:', allOrdersSnapshot.size);
    console.log('🔍 getDashboardData - merchantId recherché:', merchantId);

    // DEBUG: Vérifier quelques commandes si elles existent
    if (allOrdersSnapshot.size > 0) {
      const firstDoc = allOrdersSnapshot.docs[0];
      if (firstDoc) {
        const firstOrder = firstDoc.data();
        console.log('🔍 getDashboardData - Premier ordre:', {
          id: firstDoc.id,
          merchantId: firstOrder['merchantId'],
          status: firstOrder['status'],
          total: firstOrder['total'],
          created_at: firstOrder['created_at'],
        });
      }
    }

    // Récupérer les produits
    const productsSnapshot = await merchantRef.collection('products').get();
    console.log('🔍 getDashboardData - Nombre de produits trouvés:', productsSnapshot.size);

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
        // Récupérer les items (plusieurs formats possibles)
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

    // Récupérer le document marchand pour obtenir le rating_summary
    const merchantDoc = await merchantRef.get();
    const merchantData = merchantDoc.data();

    // Récupérer la note moyenne depuis rating_summary (mis à jour automatiquement par le service)
    const ratingSummary = merchantData?.['rating_summary'] as { average?: number; count?: number; averageRating?: number; totalReviews?: number } | undefined;
    const averageRating = ratingSummary?.averageRating ?? ratingSummary?.average ?? 0;
    const totalReviews = ratingSummary?.totalReviews ?? ratingSummary?.count ?? 0;

    // 🔧 Récupérer les avis depuis la sous-collection 'ratings' (utilisée par Flutter)
    let ratingsSnapshot;
    try {
      ratingsSnapshot = await merchantRef
        .collection('ratings')
        .orderBy('created_at', 'desc')
        .limit(10)
        .get();
    } catch (error) {
      ratingsSnapshot = await merchantRef.collection('ratings').limit(10).get();
    }

    // Calcul des tendances
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
      // Créer une description plus informative
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

    return {
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
    };
  } catch (error) {
    console.error('❌ Erreur getDashboardData:', error);
    return null;
  }
}

export default async function DashboardPage() {
  // Authentification
  const session = await auth();

  // ⚠️ MODE TEST : Utilisateur fictif (fallback)
  const testUser = {
    name: 'Marchand Test',
    email: 'test@marchand.nythy.com',
    image: null,
  };

  const currentUser = session?.user || testUser;

  // Récupérer le merchantId et les données du dashboard + marchand
  const userId = session?.user?.id;
  let merchantId: string | null = null;
  let dashboardData = null;
  let merchantData = null;

  console.log('🔍 Dashboard - userId:', userId);

  // Vérifier si l'utilisateur est un admin et rediriger si nécessaire
  if (userId) {
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const role = userData?.['role'];
        
        // Si c'est un admin, rediriger vers la page admin
        if (role === 'admin') {
          console.log('🔄 [Dashboard] Admin détecté, redirection vers /admin');
          redirect('/admin');
        }
      }
    } catch (error) {
      // Ne pas capturer NEXT_REDIRECT qui est l'exception normale de redirect()
      if ((error as any)?.message === 'NEXT_REDIRECT' || (error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
      console.error('❌ [Dashboard] Erreur vérification rôle:', error);
    }
  }

  if (userId) {
    merchantId = await getMerchantId(userId);
    console.log('🔍 Dashboard - merchantId trouvé:', merchantId);

    if (merchantId) {
      // Récupérer les données du dashboard
      dashboardData = await getDashboardData(merchantId);
      console.log('🔍 Dashboard - dashboardData:', {
        hasData: !!dashboardData,
        totalOrders: dashboardData?.stats?.totalOrders,
        totalRevenue: dashboardData?.stats?.totalRevenue,
      });

      // Récupérer les données du marchand
      try {
        const merchantDoc = await adminDb.collection('merchants').doc(merchantId).get();
        if (merchantDoc.exists) {
          const data = merchantDoc.data();
          merchantData = {
            id: merchantDoc.id,
            name: data?.['name'] || data?.['business_name'] || 'Commerce',
            businessName: data?.['business_name'] || data?.['name'] || 'Commerce',
            email: data?.['email'] || data?.['contact_email'] || currentUser.email,
            phone: data?.['phone'] || data?.['contact_phone'] || '',
            address: data?.['address'] || '',
            city: data?.['city'] || '',
            postalCode: data?.['postal_code'] || data?.['postalCode'] || '',
            description: data?.['description'] || '',
            logo: data?.['logo'] || data?.['logo_url'] || null,
            type: data?.['type'] || data?.['merchant_type'] || 'restaurant',
          };
        }
      } catch (error) {
        console.error('❌ Erreur récupération données marchand:', error);
      }
    } else {
      console.log('❌ Dashboard - Aucun merchantId trouvé pour l\'utilisateur');
    }
  } else {
    console.log('❌ Dashboard - Aucun userId (utilisateur non authentifié)');
  }

  // Utiliser les données du marchand si disponibles
  const displayUser = merchantData ? {
    name: merchantData.businessName,
    email: merchantData.email,
    image: merchantData.logo,
  } : currentUser;

  // Avertissement si pas de merchantId
  const showAuthWarning = !merchantId && userId;
  const showNoAuthWarning = !userId;

  return (
    <div className="min-h-screen bg-surface">
      {/* Header */}
      <MerchantHeader user={displayUser} />

      <div className="flex">
        {/* Sidebar */}
        <MerchantSidebar />

        {/* Main Content */}
        <main className="flex-1 p-8 lg:pb-8 pb-24">
          {/* Avertissement non authentifié */}
          {showNoAuthWarning && (
            <div className="mb-8 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="text-4xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-800 mb-2">
                    Non authentifié
                  </h3>
                  <p className="text-red-700 mb-4">
                    Vous devez vous connecter avec un compte marchand pour accéder au dashboard.
                  </p>
                  <a
                    href="/auth/signin"
                    className="inline-block px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Se connecter
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Avertissement pas de merchantId */}
          {showAuthWarning && (
            <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="text-4xl">⚠️</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">
                    Commerce non trouvé
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    Votre compte utilisateur n'est pas lié à un commerce.
                    Veuillez créer votre commerce ou contacter le support.
                  </p>
                  <div className="flex gap-4">
                    <a
                      href="/merchant/debug"
                      className="inline-block px-6 py-3 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                    >
                      🔍 Page de diagnostic
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DashboardContent dashboardData={dashboardData} />
        </main>
      </div>
    </div>
  );
}
