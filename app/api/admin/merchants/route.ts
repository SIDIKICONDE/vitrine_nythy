import { adminDb } from '@/lib/firebase-admin';
import { AdminMerchant } from '@/types/admin';
import { NextResponse } from 'next/server';

/**
 * API Route pour la gestion des commerces
 * GET /api/admin/merchants - Liste tous les commerces
 */
export async function GET() {
  try {
    const merchantsSnapshot = await adminDb
      .collection('merchants')
      .orderBy('createdAt', 'desc')
      .limit(1000)
      .get();

    const merchants: AdminMerchant[] = [];

    for (const doc of merchantsSnapshot.docs) {
      const merchantData = doc.data();

      // Compter les offres du commerce
      const offersSnapshot = await adminDb
        .collection('offers')
        .where('merchantId', '==', doc.id)
        .get();

      // Compter les commandes du commerce
      const ordersSnapshot = await adminDb
        .collection('orders')
        .where('merchantId', '==', doc.id)
        .get();

      merchants.push({
        id: doc.id,
        name: merchantData['name'] || '',
        email: merchantData['email'] || '',
        category: merchantData['category'] || 'Autre',
        address: merchantData['address'] || '',
        city: merchantData['city'] || '',
        phone: merchantData['phone'],
        isVerified: merchantData['isVerified'] || false,
        status: merchantData['status'] || 'pending',
        totalOffers: offersSnapshot.size,
        totalOrders: ordersSnapshot.size,
        rating: merchantData['rating'] || 0,
        createdAt: merchantData['createdAt']?.toDate?.()?.toISOString() || new Date().toISOString(),
        logoUrl: merchantData['logoUrl'],
        bannerUrl: merchantData['bannerUrl'],
        hasSvgLogo: merchantData['logoUrl']?.endsWith('.svg') || false,
        hasSvgBanner: merchantData['bannerUrl']?.endsWith('.svg') || false,
      });
    }

    return NextResponse.json({ merchants }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur chargement commerces:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des commerces' },
      { status: 500 }
    );
  }
}

