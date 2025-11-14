import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import * as speakeasy from 'speakeasy';

/**
 * POST /api/merchant/2fa/enable
 * Génère un secret TOTP et un QR code pour activer le 2FA
 * 🔐 Protégé par App Check
 */
export async function POST(request: NextRequest) {
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
    const userEmail = session.user.email || 'Nythy User';

    console.log('🔐 [2FA] Génération du secret TOTP pour:', userId);

    // Générer un secret TOTP unique
    const secret = speakeasy.generateSecret({
      name: `Nythy (${userEmail})`,
      issuer: 'Nythy',
      length: 32,
    });

    // Sauvegarder temporairement le secret (non confirmé encore)
    await adminDb.collection('users').doc(userId).set(
      {
        '2fa_temp_secret': secret.base32,
        '2fa_temp_created_at': new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // Logger la génération du secret
    await adminDb.collection('security_logs').add({
      type: '2fa_setup_started',
      userId,
      email: userEmail,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    console.log('✅ [2FA] Secret généré et sauvegardé temporairement');

    return NextResponse.json({
      success: true,
      secret: secret.base32,
      qrCodeUrl: secret.otpauth_url || `otpauth://totp/Nythy:${userEmail}?secret=${secret.base32}&issuer=Nythy`,
    });
  } catch (error: any) {
    console.error('❌ [2FA] Erreur activation:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de l\'activation du 2FA' },
      { status: 500 }
    );
  }
}

