import { adminDb } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { NextRequest, NextResponse } from 'next/server';
import * as speakeasy from 'speakeasy';

/**
 * POST /api/merchant/2fa/login-verify
 * Vérifie le code 2FA lors de la connexion
 * 🔐 Protégé par App Check avec rate limiting
 */

// Rate limiting simple en mémoire (en production, utiliser Redis)
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(request: NextRequest) {
  try {
    // 🔐 Vérifier App Check
    const isDev = process.env['NODE_ENV'] === 'development';
    const appCheckResult = await verifyAppCheckToken(request, {
      strict: !isDev,
      consumeToken: !isDev,
    });
    if (appCheckResult instanceof NextResponse) {
      return appCheckResult;
    }

    const { email, code, useRecoveryCode } = await request.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email et code requis' },
        { status: 400 }
      );
    }

    // Rate limiting : max 5 tentatives par 15 minutes
    const now = Date.now();
    const attemptKey = `2fa-login:${email}`;
    const attempts = loginAttempts.get(attemptKey);

    if (attempts) {
      if (now < attempts.resetAt) {
        if (attempts.count >= 5) {
          console.warn('🚨 [2FA] Trop de tentatives pour:', email);
          return NextResponse.json(
            { success: false, message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
            { status: 429 }
          );
        }
        attempts.count++;
      } else {
        // Reset après 15 minutes
        loginAttempts.set(attemptKey, { count: 1, resetAt: now + 15 * 60 * 1000 });
      }
    } else {
      loginAttempts.set(attemptKey, { count: 1, resetAt: now + 15 * 60 * 1000 });
    }

    console.log('🔐 [2FA] Vérification login 2FA pour:', email);

    // Récupérer l'utilisateur par email
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    const secret = userData?.['2fa_secret'];
    const enabled = userData?.['2fa_enabled'];

    if (!enabled || !secret) {
      return NextResponse.json(
        { success: false, message: '2FA non activé pour ce compte' },
        { status: 400 }
      );
    }

    let verified = false;

    if (useRecoveryCode) {
      // Vérifier un code de récupération
      const recoveryCodes = userData?.['2fa_recovery_codes'] || [];
      const codeIndex = recoveryCodes.findIndex(
        (rc: any) => rc.code === code && !rc.used
      );

      if (codeIndex !== -1) {
        verified = true;
        // Marquer le code comme utilisé
        recoveryCodes[codeIndex].used = true;
        recoveryCodes[codeIndex].usedAt = new Date().toISOString();
        
        await adminDb.collection('users').doc(userDoc.id).update({
          '2fa_recovery_codes': recoveryCodes,
          updatedAt: new Date().toISOString(),
        });

        console.log('✅ [2FA] Code de récupération utilisé pour:', email);
      }
    } else {
      // Vérifier le code TOTP
      verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: code,
        window: 2,
      });
    }

    if (verified) {
      // Supprimer les tentatives en cas de succès
      loginAttempts.delete(attemptKey);

      // Logger la connexion réussie
      await adminDb.collection('security_logs').add({
        type: '2fa_login_success',
        userId: userDoc.id,
        email,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      console.log('✅ [2FA] Vérification login réussie pour:', email);

      return NextResponse.json({
        success: true,
        userId: userDoc.id,
        message: 'Code 2FA valide',
      });
    } else {
      // Logger la tentative échouée
      await adminDb.collection('security_logs').add({
        type: '2fa_login_failed',
        email,
        timestamp: new Date().toISOString(),
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });

      console.error('❌ [2FA] Code invalide pour:', email);

      return NextResponse.json(
        { success: false, message: 'Code invalide' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('❌ [2FA] Erreur vérification login:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}

