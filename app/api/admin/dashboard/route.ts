import { adminDb } from '@/lib/firebase-admin';
import { AdminStats } from '@/types/admin';
import { NextResponse } from 'next/server';

/**
 * API Route pour le dashboard d'administration
 * GET /api/admin/dashboard
 * 
 * Retourne toutes les statistiques de la plateforme
 */
export async function GET() {
  try {
    // TODO: Vérifier que l'utilisateur est admin
    // const session = await getServerSession();
    // if (!session || session.user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Calculer toutes les statistiques en parallèle
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      usersSnapshot,
      activeUsersSnapshot,
      bannedUsersSnapshot,
      todayUsersSnapshot,
      merchantsSnapshot,
      pendingMerchantsSnapshot,
      verifiedMerchantsSnapshot,
      offersSnapshot,
      activeOffersSnapshot,
      ordersSnapshot,
      todayOrdersSnapshot,
      referralsSnapshot,
      todayReferralsSnapshot,
    ] = await Promise.all([
      // Total utilisateurs
      adminDb.collection('users').count().get(),

      // Utilisateurs actifs (connectés dans les 30 derniers jours)
      adminDb
        .collection('users')
        .where('lastActive', '>=', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .count()
        .get(),

      // Utilisateurs bannis
      adminDb
        .collection('users')
        .where('isBanned', '==', true)
        .count()
        .get(),

      // Utilisateurs créés aujourd'hui
      adminDb
        .collection('users')
        .where('createdAt', '>=', startOfToday)
        .count()
        .get(),

      // Total commerces
      adminDb.collection('merchants').count().get(),

      // Commerces en attente
      adminDb
        .collection('merchants')
        .where('status', '==', 'pending')
        .count()
        .get(),

      // Commerces vérifiés
      adminDb
        .collection('merchants')
        .where('isVerified', '==', true)
        .count()
        .get(),

      // Total offres
      adminDb.collection('offers').count().get(),

      // Offres actives
      adminDb
        .collection('offers')
        .where('isActive', '==', true)
        .count()
        .get(),

      // Total commandes
      adminDb.collection('orders').count().get(),

      // Commandes aujourd'hui
      adminDb
        .collection('orders')
        .where('createdAt', '>=', startOfToday)
        .count()
        .get(),

      // Total parrainages
      adminDb.collection('referrals').count().get(),

      // Parrainages aujourd'hui
      adminDb
        .collection('referrals')
        .where('createdAt', '>=', startOfToday)
        .count()
        .get(),
    ]);

    // Calculer le revenu (nécessite d'agréger les commandes)
    const ordersQuery = await adminDb
      .collection('orders')
      .where('status', '==', 'completed')
      .get();

    let totalRevenue = 0;
    let todayRevenue = 0;

    ordersQuery.docs.forEach(doc => {
      const order = doc.data();
      const amount = order['amount'] || 0;
      totalRevenue += amount;

      if (order['createdAt'] && order['createdAt'].toDate() >= startOfToday) {
        todayRevenue += amount;
      }
    });

    // Calculer les récompenses de parrainage
    const referralsQuery = await adminDb.collection('referrals').get();
    let totalReferralRewards = 0;
    let activeReferralCodes = 0;

    referralsQuery.docs.forEach(doc => {
      const referral = doc.data();
      totalReferralRewards += (referral['reward'] || 0);
      if (referral['isActive']) {
        activeReferralCodes++;
      }
    });

    // Compter les commerces avec logos/bannières SVG
    const merchantsQuery = await adminDb.collection('merchants').get();
    let merchantsWithSvgLogos = 0;
    let merchantsWithSvgBanners = 0;

    merchantsQuery.docs.forEach(doc => {
      const merchant = doc.data();
      if (merchant['logoUrl'] && merchant['logoUrl'].endsWith('.svg')) {
        merchantsWithSvgLogos++;
      }
      if (merchant['bannerUrl'] && merchant['bannerUrl'].endsWith('.svg')) {
        merchantsWithSvgBanners++;
      }
    });

    const stats: AdminStats = {
      totalUsers: usersSnapshot.data().count,
      activeUsers: activeUsersSnapshot.data().count,
      bannedUsers: bannedUsersSnapshot.data().count,
      todayUsers: todayUsersSnapshot.data().count,
      totalMerchants: merchantsSnapshot.data().count,
      pendingMerchants: pendingMerchantsSnapshot.data().count,
      verifiedMerchants: verifiedMerchantsSnapshot.data().count,
      totalOffers: offersSnapshot.data().count,
      activeOffers: activeOffersSnapshot.data().count,
      totalOrders: ordersSnapshot.data().count,
      todayOrders: todayOrdersSnapshot.data().count,
      totalRevenue,
      todayRevenue,
      totalReferrals: referralsSnapshot.data().count,
      todayReferrals: todayReferralsSnapshot.data().count,
      activeReferralCodes,
      totalReferralRewards,
      merchantsWithSvgLogos,
      merchantsWithSvgBanners,
    };

    console.log('📊 [ADMIN] Dashboard stats calculées:', stats);

    return NextResponse.json(
      { stats, lastUpdated: new Date().toISOString() },
      {
        status: 200,
        headers: {
          'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('❌ [ADMIN] Erreur dashboard:', error);

    return NextResponse.json(
      {
        error: 'Erreur lors du chargement du dashboard',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      },
      { status: 500 }
    );
  }
}

