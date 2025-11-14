import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * PATCH /api/merchant/[merchantId]/settings
 * Met à jour les paramètres d'un marchand
 * 🔐 Protégé par App Check avec protection contre le rejeu
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
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

    const { merchantId } = await params;
    const updates = await request.json();

    console.log('⚙️ [API] Mise à jour paramètres merchant:', merchantId);

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
    if (merchantData?.['owner_user_id'] !== session.user.id && merchantData?.['ownerUserId'] !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Normaliser les données pour Firestore (snake_case)
    const firestoreUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    // Mapper les champs camelCase vers snake_case
    const fieldMapping: Record<string, string> = {
      businessName: 'business_name',
      legalName: 'legal_name',
      merchantType: 'type', // Mapper vers 'type' pour compatibilité
      logoUrl: 'logo',
      bannerUrl: 'banner',
      websiteUrl: 'website',
      postalCode: 'postal_code',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      paymentPreference: 'payment_preference',
      followersCount: 'followers_count',
      averageRating: 'average_rating',
      totalReviews: 'total_reviews',
      savedItemsCount: 'saved_items_count',
      co2Saved: 'co2_saved',
      totalOrders: 'total_orders',
      isActive: 'is_active',
      // Adresse (si envoyés comme champs individuels)
      city: 'city',
      address: 'address',
    };

    // Appliquer les mises à jour
    Object.keys(updates).forEach(key => {
      const firestoreKey = fieldMapping[key] || key;

      // Gérer l'objet address de manière spéciale
      if (key === 'address' && typeof updates[key] === 'object' && updates[key] !== null) {
        // Aplatir l'objet address en champs individuels
        firestoreUpdates['address'] = updates[key].street || '';
        firestoreUpdates['city'] = updates[key].city || '';
        firestoreUpdates['postal_code'] = updates[key].postalCode || '';
        firestoreUpdates['country'] = updates[key].country || 'France';
      }
      // Gérer contactInfo de manière spéciale
      else if (key === 'contactInfo' && typeof updates[key] === 'object' && updates[key] !== null) {
        firestoreUpdates['email'] = updates[key].email || '';
        firestoreUpdates['phone'] = updates[key].phone || '';
        firestoreUpdates['website'] = updates[key].website || '';
        firestoreUpdates['contact_email'] = updates[key].email || '';
        firestoreUpdates['contact_phone'] = updates[key].phone || '';
      }
      // Gérer notifications de manière spéciale
      else if (key === 'notifications' && typeof updates[key] === 'object' && updates[key] !== null) {
        firestoreUpdates['notification_preferences'] = {
          email: updates[key].email ?? true,
          sms: updates[key].sms ?? false,
          push: updates[key].push ?? true,
        };
      }
      // Gérer privacy de manière spéciale
      else if (key === 'privacy' && typeof updates[key] === 'object' && updates[key] !== null) {
        firestoreUpdates['privacy_settings'] = {
          show_phone: updates[key].showPhone ?? false,
          show_email: updates[key].showEmail ?? false,
          show_address: updates[key].showAddress ?? true,
        };
      }
      else {
        firestoreUpdates[firestoreKey] = updates[key];
      }

      // Si c'est merchantType, mettre à jour aussi merchantType, category et type pour compatibilité maximale
      if (key === 'merchantType') {
        firestoreUpdates['merchantType'] = updates[key];
        firestoreUpdates['category'] = updates[key];
        firestoreUpdates['type'] = updates[key]; // Format court
      }
    });

    // Mettre à jour dans Firestore
    await merchantRef.update(firestoreUpdates);

    console.log('✅ [API] Paramètres mis à jour');

    return NextResponse.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
    });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour paramètres:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la mise à jour des paramètres' },
      { status: 500 }
    );
  }
}

