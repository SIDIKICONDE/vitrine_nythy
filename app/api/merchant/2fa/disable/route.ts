import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import * as speakeasy from 'speakeasy';

/**
 * POST /api/merchant/2fa/disable
 * Désactive le 2FA après vérification du code ou mot de passe
 * 🔐 Protégé par App Check avec protection contre le rejeu
 */
export async function POST(request: NextRequest) {
  try {
    // 🔐 Vérifier App Check
    const isDev = process.env['NODE_ENV'] === 'development';
    const appCheckResult = await verifyAppCheckToken(request, {
      strict: !isDev,
      consumeToken: !isDev, // Protection contre le rejeu en production
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
    const { code } = await request.json();

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { success: false, message: 'Code de vérification requis (6 chiffres)' },
        { status: 400 }
      );
    }

    console.log('🔐 [2FA] Désactivation du 2FA pour:', userId);

    // Récupérer le secret actuel
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const secret = userData?.['2fa_secret'];
    const enabled = userData?.['2fa_enabled'];

    if (!enabled || !secret) {
      return NextResponse.json(
        { success: false, message: '2FA non activé pour ce compte' },
        { status: 400 }
      );
    }

    // Vérifier le code TOTP avant de désactiver (sécurité)
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: code,
      window: 2,
    });

    if (!verified) {
      console.error('❌ [2FA] Code invalide lors de la désactivation');
      return NextResponse.json(
        { success: false, message: 'Code invalide. Impossible de désactiver le 2FA.' },
        { status: 400 }
      );
    }

    // Code valide : désactiver le 2FA
    await adminDb.collection('users').doc(userId).update({
      '2fa_enabled': false,
      '2fa_secret': null,
      '2fa_recovery_codes': null,
      '2fa_disabled_at': new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Logger la désactivation du 2FA
    await adminDb.collection('security_logs').add({
      type: '2fa_disabled',
      userId,
      email: session.user.email,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    console.log('✅ [2FA] 2FA désactivé avec succès pour:', userId);

    return NextResponse.json({
      success: true,
      message: '2FA désactivé avec succès',
    });
  } catch (error: any) {
    console.error('❌ [2FA] Erreur désactivation:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la désactivation' },
      { status: 500 }
    );
  }
}

