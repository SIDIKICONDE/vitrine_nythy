import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PUT /api/merchant/[merchantId]
 * Met à jour un marchand existant
 * 🔐 Protégé par App Check avec protection contre le rejeu
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { merchantId: string } }
) {
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

    const { merchantId } = params;
    const updates = await request.json();

    console.log('📝 [API] Mise à jour merchant:', merchantId);

    // Récupérer le document merchant
    const merchantRef = adminDb.collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();

    if (!merchantDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Marchand non trouvé' },
        { status: 404 }
      );
    }

    const merchantData = merchantDoc.data();

    // Vérifier les permissions (propriétaire uniquement pour l'instant)
    if (merchantData?.['owner_user_id'] !== session.user.id && merchantData?.['ownerUserId'] !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Champs autorisés à la modification
    const allowedFields = [
      'name', 'description', 'type', 'category', 'address', 'addressLine1',
      'city', 'postalCode', 'countryCode', 'phone', 'email', 'website',
      'siret', 'taxId', 'socialMedia', 'location', 'images', 'isActive',
      'messageEnabled', 'banner_url', 'bannerUrl', 'iban', 'bic', 'paymentPreference'
    ];

    const updateData: any = {};

    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        if (field === 'location' && updates.location) {
          const lat = updates.location.latitude;
          const lng = updates.location.longitude;

          updateData.location = {
            latitude: lat,
            longitude: lng,
          };

          console.log('📍 [API] Localisation mise à jour');
        } else if (field === 'images' && Array.isArray(updates.images)) {
          updateData.images = updates.images.slice(0, 10);
        } else if (field === 'name') {
          updateData.name = updates[field];
          updateData.name_lowercase = String(updates[field]).toLowerCase();
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    updateData.updatedAt = new Date().toISOString();

    await merchantRef.update(updateData);

    console.log('✅ [API] Merchant mis à jour');

    return NextResponse.json({
      success: true,
      message: 'Marchand mis à jour avec succès',
    });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour merchant:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/merchant/[merchantId]
 * Supprime (soft delete) un marchand
 * 🔐 Protégé par App Check avec protection contre le rejeu
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT + PROTECTION REJEU ACTIVÉS
    const appCheckResult = await verifyAppCheckToken(request, { 
      strict: true,
      consumeToken: true // Protection contre le rejeu pour les suppressions
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

    const { merchantId } = params;

    console.log('🗑️ [API] Suppression merchant:', merchantId);

    // Récupérer le document merchant
    const merchantRef = adminDb.collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();

    if (!merchantDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Marchand non trouvé' },
        { status: 404 }
      );
    }

    const merchantData = merchantDoc.data();

    // Vérifier les permissions (propriétaire ou admin)
    // TODO: Ajouter vérification admin quand le système de rôles sera implémenté
    if (merchantData?.['owner_user_id'] !== session.user.id && merchantData?.['ownerUserId'] !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Soft delete
    await merchantRef.update({
      isActive: false,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: session.user.id,
    });

    // Mettre à jour le rôle de l'utilisateur propriétaire
    if (merchantData?.['owner_user_id'] || merchantData?.['ownerUserId']) {
      const ownerId = merchantData['owner_user_id'] || merchantData['ownerUserId'];
      try {
        await adminDb.collection('users').doc(ownerId).update({
          role: 'user',
          merchantId: null,
        });
      } catch (userError) {
        console.error('⚠️ [API] Erreur mise à jour user:', userError);
        // Continue quand même
      }
    }

    console.log('✅ [API] Merchant supprimé (soft delete)');

    return NextResponse.json({
      success: true,
      message: 'Marchand supprimé avec succès',
    });
  } catch (error) {
    console.error('❌ [API] Erreur suppression merchant:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}

