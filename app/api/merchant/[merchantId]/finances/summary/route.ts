import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { COMMISSION_ENABLED, COMMISSION_RATE } from '../config';

/**
 * GET /api/merchant/[merchantId]/finances/summary
 * Récupère le résumé financier d'un marchand
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
    console.log('🚀 [API] Début récupération résumé financier');

    // Vérifier l'authentification
    const session = await auth();
    console.log('🔐 [API] Session:', {
      exists: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    });

    if (!session?.user?.id) {
      console.warn('⚠️  [API] Utilisateur non authentifié');
      return NextResponse.json(
        { success: false, message: 'Utilisateur non authentifié', error: 'NO_SESSION' },
        { status: 401 }
      );
    }

    const { merchantId } = await params;

    // Valider merchantId
    if (!merchantId || merchantId === 'temp' || merchantId === '' || merchantId === 'undefined' || merchantId === 'null') {
      console.warn('⚠️  [API] MerchantId invalide:', merchantId);
      return NextResponse.json(
        { success: false, message: 'MerchantId invalide', error: 'INVALID_MERCHANT_ID' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';

    console.log('💰 [API] Récupération résumé financier pour merchant:', merchantId, 'période:', period);

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
    const sessionUserId = (session.user as any).id;

    console.log('🔐 [API] Vérification ownership:', {
      sessionUserId,
      ownerUserId: merchantData?.['ownerUserId'],
      owner_user_id: merchantData?.['owner_user_id'],
    });

    if (merchantData?.['owner_user_id'] !== sessionUserId && merchantData?.['ownerUserId'] !== sessionUserId) {
      console.warn('⚠️  [API] Non autorisé - Ownership invalide');
      return NextResponse.json(
        { success: false, message: 'Non autorisé - Ce commerce ne vous appartient pas' },
        { status: 403 }
      );
    }

    console.log('✅ [API] Ownership vérifié - Calcul des statistiques...');

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
      case 'all':
      default:
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 10);
        break;
    }

    // Récupérer les commandes complétées dans la période
    // Note: Firestore ne permet qu'un seul index de range query, donc on filtre les dates en mémoire
    const ordersSnapshot = await adminDb
      .collection('orders')
      .where('merchantId', '==', merchantId)
      .where('status', '==', 'completed')
      .get();

    // Calculer les statistiques (toujours initialiser à 0 pour éviter les pages vides)
    let totalRevenue = 0;
    let totalOrders = 0;
    let totalCommissions = 0;
    const revenueByDay: Record<string, { revenue: number; orders: number }> = {};

    // Si aucune commande, on retourne des valeurs à 0 (pour nouveaux marchands)
    if (ordersSnapshot.empty) {
      console.log('⚠️  [API] Aucune commande trouvée - retour valeurs par défaut à 0€');
    } else {
      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data();

        // Extraire la date de création (supporter à la fois created_at et createdAt)
        const createdAtRaw = order['created_at'] || order['createdAt'];
        if (!createdAtRaw) return; // Ignorer si pas de date

        const orderDate = (() => {
          if (createdAtRaw instanceof Date) {
            return createdAtRaw;
          }

          if (typeof createdAtRaw === 'string' || typeof createdAtRaw === 'number') {
            const parsed = new Date(createdAtRaw);
            return Number.isNaN(parsed.getTime()) ? null : parsed;
          }

          if (typeof createdAtRaw === 'object' && createdAtRaw) {
            if (typeof (createdAtRaw as any).toDate === 'function') {
              const parsed = (createdAtRaw as { toDate: () => Date }).toDate();
              return Number.isNaN(parsed.getTime()) ? null : parsed;
            }

            if ('seconds' in createdAtRaw && typeof (createdAtRaw as any).seconds === 'number') {
              const parsed = new Date((createdAtRaw as { seconds: number }).seconds * 1000);
              return Number.isNaN(parsed.getTime()) ? null : parsed;
            }
          }

          console.warn('⚠️  [API] created_at invalide pour la commande:', doc.id, createdAtRaw);
          return null;
        })();

        if (!orderDate) return;

        // Filtrer par période (en mémoire car Firestore ne permet qu'un index de range)
        if (orderDate < startDate || orderDate > endDate) return;

        const orderTotal = order['total'] || order['totalAmount'] || 0;

        // Calculer la commission selon la configuration
        const commission = COMMISSION_ENABLED ? orderTotal * COMMISSION_RATE : 0;

        totalRevenue += orderTotal;
        totalOrders += 1;
        totalCommissions += commission;

        // Revenue par jour
        const dateKey: string = orderDate.toISOString().split('T')[0] as string;
        if (!revenueByDay[dateKey]) {
          revenueByDay[dateKey] = { revenue: 0, orders: 0 };
        }
        revenueByDay[dateKey]!.revenue += orderTotal;
        revenueByDay[dateKey]!.orders += 1;
      });
    }

    // Récupérer les versements (payouts) depuis une collection dédiée si elle existe
    // Pour l'instant, on calcule basé sur les commandes
    const totalFees = totalCommissions;
    const netRevenue = totalRevenue - totalFees;

    // Calculer les versements (fictif pour l'instant - à adapter selon votre logique)
    // Si pas de revenus, tout reste à 0
    const totalPayouts = totalOrders > 0 ? netRevenue * 0.8 : 0; // 80% déjà versé
    const pendingPayouts = totalOrders > 0 ? netRevenue * 0.2 : 0; // 20% en attente
    const availableBalance = netRevenue - totalPayouts - pendingPayouts;

    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Préparer les données par jour
    const revenueByDayArray = Object.entries(revenueByDay)
      .map(([date, data]) => ({
        date,
        revenue: {
          amountMinor: Math.round(data.revenue * 100),
          currencyCode: 'EUR'
        },
        orders: data.orders
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Prochain versement (dans 7 jours)
    const nextPayoutDate = new Date(now);
    nextPayoutDate.setDate(nextPayoutDate.getDate() + 7);

    const summary = {
      merchantId,
      period,
      totalRevenue: {
        amountMinor: Math.round(totalRevenue * 100),
        currencyCode: 'EUR'
      },
      totalOrders,
      averageOrderValue: {
        amountMinor: Math.round(averageOrderValue * 100),
        currencyCode: 'EUR'
      },
      totalPayouts: {
        amountMinor: Math.round(totalPayouts * 100),
        currencyCode: 'EUR'
      },
      pendingPayouts: {
        amountMinor: Math.round(pendingPayouts * 100),
        currencyCode: 'EUR'
      },
      totalFees: {
        amountMinor: Math.round(totalFees * 100),
        currencyCode: 'EUR'
      },
      totalCommissions: {
        amountMinor: Math.round(totalCommissions * 100),
        currencyCode: 'EUR'
      },
      netRevenue: {
        amountMinor: Math.round(netRevenue * 100),
        currencyCode: 'EUR'
      },
      availableBalance: {
        amountMinor: Math.round(availableBalance * 100),
        currencyCode: 'EUR'
      },
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      generatedAt: now.toISOString(),
      revenueByDay: revenueByDayArray,
      nextPayoutDate: nextPayoutDate.toISOString(),
    };

    console.log(`✅ [API] Résumé financier calculé: ${totalOrders} commandes, ${totalRevenue.toFixed(2)}€`);

    // Ajouter un message si c'est un nouveau marchand sans commandes
    const isNewMerchant = totalOrders === 0;

    return NextResponse.json({
      success: true,
      summary,
      isNewMerchant, // Indiquer si c'est un nouveau marchand
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération résumé financier:', error);
    console.error('📍 [API] Stack trace:', error instanceof Error ? error.stack : 'No stack');

    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    const errorName = error instanceof Error ? error.name : 'UnknownError';

    // Logs détaillés pour le débogage
    console.log('🔍 [API] Détails de l\'erreur:', {
      type: typeof error,
      name: errorName,
      message: errorMessage,
      full: JSON.stringify(error, null, 2)
    });

    // Déterminer le type d'erreur et le status code approprié
    let statusCode = 500;
    let errorCode = 'INTERNAL_ERROR';

    if (errorMessage.includes('permission') || errorMessage.includes('PERMISSION_DENIED')) {
      statusCode = 403;
      errorCode = 'PERMISSION_DENIED';
    } else if (errorMessage.includes('not found') || errorMessage.includes('NOT_FOUND')) {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
    } else if (errorMessage.includes('auth') || errorMessage.includes('UNAUTHENTICATED')) {
      statusCode = 401;
      errorCode = 'UNAUTHENTICATED';
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Erreur lors de la récupération du résumé financier',
        error: errorCode,
        errorMessage: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined
      },
      { status: statusCode }
    );
  }
}

