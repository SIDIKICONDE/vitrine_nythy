import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/user/device-token
 * Met à jour le device token pour les notifications push
 * 🔐 Protégé par App Check avec protection contre le rejeu
 */
export async function PUT(request: NextRequest) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT + PROTECTION REJEU ACTIVÉS
    const appCheckResult = await verifyAppCheckToken(request, { 
      strict: true,
      consumeToken: true // Protection contre le rejeu pour les modifications
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
    const { deviceToken } = await request.json();

    if (!deviceToken || typeof deviceToken !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Device token requis' },
        { status: 400 }
      );
    }

    console.log('📱 [API] Mise à jour device token pour:', userId);

    await adminDb.collection('users').doc(userId).update({
      deviceToken: deviceToken,
      updatedAt: new Date().toISOString(),
    });

    console.log('✅ [API] Device token mis à jour');

    return NextResponse.json({
      success: true,
      message: 'Device token mis à jour avec succès',
    });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour device token:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la mise à jour du token' },
      { status: 500 }
    );
  }
}

