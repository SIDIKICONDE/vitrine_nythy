import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { FieldValue } from 'firebase-admin/firestore';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Transforme un produit Firestore (snake_case) en format Web (camelCase)
 */
function transformProductForFlutter(productId: string, data: any) {
  return {
    id: productId,
    merchantId: data.merchantId,
    title: data.title,
    description: data.description || null,
    sku: data.sku || null,
    // Convertir les prix en camelCase pour le frontend
    original_price: data.original_price
      ? { amountMinor: data.original_price.amount_minor, currencyCode: data.original_price.currency_code }
      : { amountMinor: 0, currencyCode: 'EUR' },
    discounted_price: data.discounted_price
      ? { amountMinor: data.discounted_price.amount_minor, currencyCode: data.discounted_price.currency_code }
      : { amountMinor: 0, currencyCode: 'EUR' },
    quantity: data.quantity ?? 1,
    max_per_user: data.max_per_user || null,
    pickup_start: data.pickup_start || null,
    pickup_end: data.pickup_end || null,
    dietary_tags: data.dietary_tags || [],
    allergen_tags: data.allergen_tags || [],
    categoryIds: data.categoryIds || [],
    images: data.images || [],
    status: data.status || 'available',
    expires_at: data.expires_at || null,
    created_at: data.created_at || null,
    updated_at: data.updated_at || null,
    category: data.category || null,
    subcategory: data.subcategory || null,
    weight_grams: data.weight_grams || null,
    surprise_description: data.surprise_description || null,
    is_surprise_box: data.is_surprise_box ?? false,
    co2_saved_grams: data.co2_saved_grams || null,
    pickup_instructions: data.pickup_instructions || null,
    view_count: data.view_count ?? 0,
    purchase_count: data.purchase_count ?? 0,
  };
}

/**
 * GET /api/merchant/[merchantId]/products/[productId]
 * Récupère un produit spécifique
 * 🔐 Protégé par App Check
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; productId: string }> }
) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT ACTIVÉ
    const appCheckResult = await verifyAppCheckToken(request, { strict: true });
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

    const { merchantId, productId } = await params;

    console.log('📦 [API] Récupération produit:', productId);

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

    // Récupérer le produit
    const productRef = merchantRef.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Transformer les données pour Flutter
    const product = transformProductForFlutter(productDoc.id, productDoc.data());

    console.log('✅ [API] Produit récupéré');

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération produit:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération du produit' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/merchant/[merchantId]/products/[productId]
 * Met à jour un produit existant
 * 🔐 Protégé par App Check avec protection contre le rejeu
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; productId: string }> }
) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT + PROTECTION REJEU ACTIVÉS
    const appCheckResult = await verifyAppCheckToken(request, { 
      strict: true,
      consumeToken: true // Protection contre le rejeu pour les mises à jour
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

    const { merchantId, productId } = await params;
    const updates = await request.json();

    console.log('📝 [API] Mise à jour produit:', productId);

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

    // Vérifier que le produit existe
    const productRef = merchantRef.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      return NextResponse.json(
        { success: false, message: 'Produit non trouvé' },
        { status: 404 }
      );
    }

    // Champs autorisés à la modification
    const allowedFields = [
      'title', 'description', 'original_price', 'discounted_price',
      'category', 'images', 'quantity', 'status', 'expires_at',
      'dietary_tags', 'allergen_tags', 'pickup_start', 'pickup_end',
      'max_per_user', 'is_surprise_box', 'surprise_description',
      'co2_saved_grams', 'pickup_instructions', 'weight_grams', 'categoryIds'
    ];

    const toMinor = (price: number) => Math.round(price * 100);

    const parseTimestamp = (value: any): string | null => {
      if (!value) return null;
      try {
        if (typeof value === 'string') {
          const d = new Date(value);
          return isNaN(d.getTime()) ? null : d.toISOString();
        }
        if (typeof value === 'number') {
          return new Date(value).toISOString();
        }
        return null;
      } catch {
        return null;
      }
    };

    const normalizeStatus = (status?: string): string => {
      if (!status) return 'available';
      switch (status) {
        case 'available': return 'available';
        case 'sold_out':
        case 'soldOut': return 'sold-out';
        case 'reserved':
        case 'scheduled': return 'scheduled';
        case 'hidden':
        case 'archived': return 'archived';
        case 'expired': return 'expired';
        default: return 'available';
      }
    };

    const updateData: any = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        const value = updates[field];

        if (field === 'images' && Array.isArray(value)) {
          updateData.images = value.slice(0, 10).map((img: any, idx: number) => {
            if (typeof img === 'string') {
              return { url: img, is_primary: idx === 0, alt: null, width: null, height: null };
            }
            return {
              url: String(img.url || img.href || ''),
              is_primary: Boolean(img.is_primary || img.isPrimary || idx === 0),
              alt: img.alt ? String(img.alt) : null,
              width: img.width != null ? parseInt(img.width) : null,
              height: img.height != null ? parseInt(img.height) : null,
            };
          });
        } else if ((field === 'original_price' || field === 'discounted_price') && value != null) {
          if (typeof value === 'number' || typeof value === 'string') {
            updateData[field] = { amount_minor: toMinor(parseFloat(String(value))), currency_code: 'EUR' };
          } else if (typeof value === 'object' && value.amount_minor != null) {
            updateData[field] = {
              amount_minor: parseInt(String(value.amount_minor)),
              currency_code: String(value.currency_code || 'EUR'),
            };
          }
        } else if (field === 'status') {
          updateData.status = normalizeStatus(value);
        } else if (field === 'expires_at' || field === 'pickup_start' || field === 'pickup_end') {
          updateData[field] = parseTimestamp(value);
        } else {
          updateData[field] = value;
        }
      }
    }

    updateData.updated_at = new Date().toISOString();

    await productRef.update(updateData);

    console.log('✅ [API] Produit mis à jour');

    return NextResponse.json({
      success: true,
      message: 'Produit mis à jour avec succès',
    });
  } catch (error) {
    console.error('❌ [API] Erreur mise à jour produit:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/merchant/[merchantId]/products/[productId]
 * Supprime un produit
 * 🔐 Protégé par App Check avec protection contre le rejeu
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string; productId: string }> }
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

    const { merchantId, productId } = await params;

    console.log('🗑️ [API] Suppression produit:', productId);

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

    // Supprimer le produit
    const productRef = merchantRef.collection('products').doc(productId);
    await productRef.delete();

    // Mettre à jour les stats du merchant
    try {
      await merchantRef.update({
        'stats.totalProducts': FieldValue.increment(-1),
      });
    } catch (statsError) {
      console.error('⚠️ [API] Erreur mise à jour stats:', statsError);
    }

    // Mettre à jour la sous-collection stats (compatibilité)
    try {
      await merchantRef.collection('stats').doc('summary').update({
        productCount: FieldValue.increment(-1),
        lastUpdated: new Date().toISOString(),
      });
    } catch (subStatsError) {
      console.error('⚠️ [API] Erreur sous-collection stats:', subStatsError);
    }

    console.log('✅ [API] Produit supprimé');

    return NextResponse.json({
      success: true,
      message: 'Produit supprimé avec succès',
    });
  } catch (error) {
    console.error('❌ [API] Erreur suppression produit:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}

