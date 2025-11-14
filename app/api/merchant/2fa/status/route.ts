import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/merchant/2fa/status
 * Récupère le statut 2FA de l'utilisateur
 * 🔐 Protégé par App Check
 */
export async function GET(request: NextRequest) {
  try {
    // 🔐 Vérifier App Check
    const isDev = process.env['NODE_ENV'] === 'development';
    const appCheckResult = await verifyAppCheckToken(request, {
      strict: !isDev,
      consumeToken: false,
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

    const userId = session.user.id;

    // Récupérer le statut 2FA depuis Firestore
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();

    const is2FAEnabled = userData?.['2fa_enabled'] === true;
    const hasRecoveryCodes = Array.isArray(userData?.['2fa_recovery_codes']) &&
      (userData?.['2fa_recovery_codes'] || []).length > 0;

    return NextResponse.json({
      success: true,
      enabled: is2FAEnabled,
      activatedAt: userData?.['2fa_activated_at'] || null,
      hasRecoveryCodes,
      recoveryCodesCount: hasRecoveryCodes ? (userData?.['2fa_recovery_codes'] || []).length : 0,
    });
  } catch (error: any) {
    console.error('❌ [2FA] Erreur récupération statut:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la récupération du statut' },
      { status: 500 }
    );
  }
}

