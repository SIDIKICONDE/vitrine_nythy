import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/user/profile
 * Met à jour le profil utilisateur
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
    const { displayName, photoURL, phoneNumber, preferences, location } = await request.json();

    console.log('📝 [API] Mise à jour profil utilisateur:', userId);

    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (location !== undefined) {
      if (location) {
        updateData.location = {
          latitude: location.latitude,
          longitude: location.longitude,
        };
      } else {
        updateData.location = null;
      }
    }

    await userRef.update(updateData);

    console.log('✅ [API] Profil utilisateur mis à jour');

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
    });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour profil:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}

