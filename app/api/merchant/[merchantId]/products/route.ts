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
 * GET /api/merchant/[merchantId]/products
 * Récupère tous les produits d'un marchand
 * 🔐 Protégé par App Check
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
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

    // Next.js 15: params est une Promise
    const { merchantId } = await params;

    console.log('📦 [API] Récupération produits pour merchant:', merchantId);

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

    // Récupérer tous les produits
    const productsSnapshot = await merchantRef.collection('products').get();

    // Transformer les données Firestore (snake_case) en format Flutter (camelCase)
    // Filtrer les documents d'initialisation (ceux qui commencent par _)
    const products = productsSnapshot.docs
      .filter(doc => !doc.id.startsWith('_'))
      .map(doc => transformProductForFlutter(doc.id, doc.data()));

    console.log(`✅ [API] ${products.length} produits récupérés (${productsSnapshot.docs.length - products.length} documents système exclus)`);

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error('❌ [API] Erreur récupération produits:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la récupération des produits' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/merchant/[merchantId]/products
 * Crée un nouveau produit anti-gaspillage
 * 🔐 Protégé par App Check avec protection contre le rejeu
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ merchantId: string }> }
) {
  try {
    // 🔐 Vérifier App Check - MODE STRICT + PROTECTION REJEU ACTIVÉS
    const appCheckResult = await verifyAppCheckToken(request, { 
      strict: true,
      consumeToken: true // Protection contre le rejeu pour les créations
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

    // Next.js 15: params est une Promise
    const { merchantId } = await params;
    const data = await request.json();

    console.log('🛍️ [API] Création produit pour merchant:', merchantId);

    // Validation des champs requis
    if (!data.title || data.originalPrice == null || data.discountedPrice == null) {
      return NextResponse.json(
        { success: false, message: 'Titre, prix original et prix réduit requis' },
        { status: 400 }
      );
    }

    // Validation: prix réduit < prix original
    if (parseFloat(data.discountedPrice) >= parseFloat(data.originalPrice)) {
      return NextResponse.json(
        { success: false, message: 'Le prix réduit doit être inférieur au prix original' },
        { status: 400 }
      );
    }

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

    // Générer un SKU unique
    const generateSKU = async (): Promise<string> => {
      try {
        // Préfixe basé sur le nom du marchand
        let prefix = 'PRD';
        if (merchantData?.['name']) {
          const name = String(merchantData['name']).replace(/[^a-zA-Z]/g, '').toUpperCase();
          prefix = name.substring(0, 3).padEnd(3, 'X');
        }

        // Date au format YYYYMMDD
        const now = new Date();
        const dateStr = now.getFullYear().toString() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0');

        // Numéro unique
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const sku = `${prefix}-${dateStr}-${random}`;

        // Vérifier l'unicité
        const existing = await merchantRef.collection('products')
          .where('sku', '==', sku)
          .limit(1)
          .get();

        if (!existing.empty) {
          const newRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          return `${prefix}-${dateStr}-${newRandom}`;
        }

        return sku;
      } catch (error) {
        console.error('Erreur génération SKU:', error);
        return `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }
    };

    const sku = await generateSKU();

    // Fonction helper pour parser les timestamps
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

    // Normaliser le statut
    const normalizeStatus = (status?: string): string => {
      if (!status) return 'available';
      switch (status) {
        case 'available': return 'available';
        case 'sold_out':
        case 'sold-out':
        case 'soldOut': return 'sold-out';
        case 'reserved':
        case 'scheduled': return 'scheduled';
        case 'hidden':
        case 'archived': return 'archived';
        case 'expired': return 'expired';
        default: return 'available';
      }
    };

    // Convertir en centimes
    const toMinor = (price: number) => Math.round(price * 100);

    // Préparer les images
    let images = Array.isArray(data.images)
      ? data.images.slice(0, 10).map((img: any, idx: number) => {
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
      })
      : [];

    // Si aucune image, utiliser le banner du marchand par défaut
    if (images.length === 0) {
      const bannerUrl = merchantData['bannerUrl'] || merchantData['banner_url'];
      if (bannerUrl) {
        images = [{
          url: bannerUrl,
          is_primary: true,
          alt: `Banner ${merchantData['name'] || 'marchand'}`,
          width: null,
          height: null
        }];
      }
    }

    // Créer le document produit
    const productData = {
      merchantId,
      title: String(data.title).trim(),
      description: data.description ? String(data.description) : '',
      sku,
      original_price: {
        amount_minor: toMinor(data.originalPrice),
        currency_code: 'EUR'
      },
      discounted_price: {
        amount_minor: toMinor(data.discountedPrice),
        currency_code: 'EUR'
      },
      quantity: Number.isInteger(data.quantity) ? data.quantity : 1,
      max_per_user: data.maxPerUser != null ? parseInt(data.maxPerUser) : null,
      pickup_start: parseTimestamp(data.pickupStart),
      pickup_end: parseTimestamp(data.pickupEnd),
      dietary_tags: Array.isArray(data.dietaryTags) ? data.dietaryTags.map(String) : [],
      allergen_tags: Array.isArray(data.allergenTags) ? data.allergenTags.map(String) : [],
      categoryIds: Array.isArray(data.categoryIds) ? data.categoryIds.map(String) : [],
      images,
      status: normalizeStatus(data.status),
      expires_at: parseTimestamp(data.expiresAt),
      category: data.category != null ? String(data.category) : null,
      subcategory: data.subcategory != null ? String(data.subcategory) : null,
      weight_grams: data.weightGrams != null ? parseFloat(data.weightGrams) : null,
      surprise_description: data.surpriseDescription != null ? String(data.surpriseDescription) : null,
      is_surprise_box: Boolean(data.isSurpriseBox),
      co2_saved_grams: data.co2SavedGrams != null ? parseInt(data.co2SavedGrams) : null,
      pickup_instructions: data.pickupInstructions != null ? String(data.pickupInstructions) : null,
      view_count: 0,
      purchase_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Créer le produit
    const productRef = await merchantRef.collection('products').add(productData);

    // Mettre à jour les stats du merchant
    try {
      await merchantRef.update({
        'stats.totalProducts': FieldValue.increment(1),
      });
    } catch (statsError) {
      console.error('⚠️ [API] Erreur mise à jour stats:', statsError);
    }

    // Mettre à jour la sous-collection stats (compatibilité)
    try {
      await merchantRef.collection('stats').doc('summary').update({
        productCount: FieldValue.increment(1),
        lastUpdated: new Date().toISOString(),
      });
    } catch (subStatsError) {
      console.error('⚠️ [API] Erreur sous-collection stats:', subStatsError);
    }

    console.log('✅ [API] Produit créé:', productRef.id);

    return NextResponse.json({
      success: true,
      productId: productRef.id,
      sku,
      message: 'Produit créé avec succès',
    });
  } catch (error) {
    console.error('❌ [API] Erreur création produit:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de la création du produit' },
      { status: 500 }
    );
  }
}

