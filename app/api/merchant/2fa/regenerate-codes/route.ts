import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import { generateRecoveryCodes, hashRecoveryCode } from '@/lib/two-factor';

/**
 * POST /api/merchant/2fa/regenerate-codes
 * Régénère les codes de récupération (5 codes par défaut)
 * 🔐 Protégé par App Check
 */
export async function POST(request: NextRequest) {
  try {
    const isDev = process.env['NODE_ENV'] === 'development';
    const appCheckResult = await verifyAppCheckToken(request, {
      strict: !isDev,
      consumeToken: !isDev,
    });
    if (appCheckResult instanceof NextResponse) {
      return appCheckResult;
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non authentifié' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userDoc = await adminDb.collection('users').doc(userId);
    const userData = (await userDoc.get()).data();

    if (!userData?.['2fa_enabled']) {
      return NextResponse.json(
        { success: false, message: '2FA non activé pour ce compte' },
        { status: 400 }
      );
    }

    const recoveryCodes = generateRecoveryCodes(5);
    const hashedCodes = recoveryCodes.map(code => ({
      hash: hashRecoveryCode(code),
      used: false,
      createdAt: new Date().toISOString(),
    }));

    await userDoc.update({
      '2fa_recovery_codes': hashedCodes,
      '2fa_recovery_regenerated_at': new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await adminDb.collection('security_logs').add({
      type: '2fa_recovery_regenerated',
      userId,
      email: session.user.email,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({
      success: true,
      recoveryCodes,
      recoveryCodesCount: hashedCodes.length,
    });
  } catch (error: any) {
    console.error('❌ [2FA] Erreur régénération codes:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la régénération' },
      { status: 500 }
    );
  }
}

