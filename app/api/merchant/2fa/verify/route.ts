import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';
import * as speakeasy from 'speakeasy';
import { generateRecoveryCodes, hashRecoveryCode } from '@/lib/two-factor';

/**
 * POST /api/merchant/2fa/verify
 * Vérifie le code TOTP et active définitivement le 2FA
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
        { success: false, message: 'Code invalide (6 chiffres requis)' },
        { status: 400 }
      );
    }

    console.log('🔐 [2FA] Vérification du code pour:', userId);

    // Récupérer le secret temporaire
    const userDoc = await adminDb.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const tempSecret = userData?.['2fa_temp_secret'];

    if (!tempSecret) {
      return NextResponse.json(
        { success: false, message: 'Aucune configuration 2FA en cours. Veuillez recommencer.' },
        { status: 400 }
      );
    }

    // Vérifier le code TOTP
    const verified = speakeasy.totp.verify({
      secret: tempSecret,
      encoding: 'base32',
      token: code,
      window: 2, // Accepter les codes dans une fenêtre de ±2 périodes (60s)
    });

    if (!verified) {
      console.error('❌ [2FA] Code invalide');
      return NextResponse.json(
        { success: false, message: 'Code invalide. Vérifiez le code dans votre application.' },
        { status: 400 }
      );
    }

    // Générer des codes de récupération
    const recoveryCodes = generateRecoveryCodes(5);
    const hashedCodes = recoveryCodes.map(code => ({
      hash: hashRecoveryCode(code), // Hasher pour la sécurité
      used: false,
      createdAt: new Date().toISOString(),
    }));

    // Code valide : activer le 2FA définitivement
    await adminDb.collection('users').doc(userId).update({
      '2fa_enabled': true,
      '2fa_secret': tempSecret, // Déplacer de temp vers permanent
      '2fa_temp_secret': null, // Supprimer le temp
      '2fa_temp_created_at': null,
      '2fa_activated_at': new Date().toISOString(),
      '2fa_recovery_codes': hashedCodes,
      updatedAt: new Date().toISOString(),
    });

    // Logger l'activation du 2FA
    await adminDb.collection('security_logs').add({
      type: '2fa_enabled',
      userId,
      email: session.user.email,
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    });

    console.log('✅ [2FA] 2FA activé avec succès pour:', userId);

    return NextResponse.json({
      success: true,
      message: '2FA activé avec succès',
      recoveryCodes, // Retourner les codes pour que l'utilisateur puisse les sauvegarder
    });
  } catch (error: any) {
    console.error('❌ [2FA] Erreur vérification:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}