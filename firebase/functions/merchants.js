const { onCall } = require('firebase-functions/v2/https');
const { HttpsError } = require('firebase-functions/https');
const admin = require('firebase-admin');

// Importer le script de correction des rôles
const { fixMerchantRoles } = require('./fix_merchant_roles.js');

// =========================================
// GESTION DES MARCHANDS
// =========================================

/**
 * Créer un nouveau marchand
 */
exports.createMerchant = onCall(async (request) => {
  // Vérifier l'authentification
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = request.auth.uid;
  const {
    name,
    description,
    category,
    address,
    phone,
    email,
    website,
    socialMedia,
    location, // { latitude, longitude }
    images,
    // Champs séparés de l'adresse pour éviter "Adresse non spécifiée"
    addressLine1,
    city,
    postalCode,
    countryCode,
  } = request.data;

  // Logs de debug pour faciliter le diagnostic côté serveur
  try {
    console.log('[createMerchant] userId:', userId);
    console.log('[createMerchant] payload keys:', Object.keys(request.data || {}));
    console.log('[createMerchant] name/category/address:', name, category, address);
    console.log('[createMerchant] location:', location);
  } catch (_) {
    // Ignorer les erreurs de log
  }

  // Validation
  if (!name || !category || !address || !location) {
    throw new HttpsError(
      'invalid-argument',
      'Nom, catégorie, adresse et localisation requis'
    );
  }

  if (location.latitude == null || location.longitude == null) {
    throw new HttpsError(
      'invalid-argument',
      'Coordonnées GPS requises'
    );
  }

  // Normaliser latitude/longitude (accepte string ou number)
  const lat = typeof location.latitude === 'number' ? location.latitude : parseFloat(location.latitude);
  const lng = typeof location.longitude === 'number' ? location.longitude : parseFloat(location.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new HttpsError('invalid-argument', 'Latitude/longitude invalides');
  }

  // Vérifier si l'utilisateur a déjà un marchand
  const existingMerchants = await admin.firestore()
    .collection('merchants')
    .where('owner_user_id', '==', userId)
    .limit(1)
    .get();

  if (!existingMerchants.empty) {
    throw new HttpsError(
      'already-exists',
      'Vous avez déjà un marchand enregistré'
    );
  }

  try {
    console.log('[createMerchant] Création du marchand avec coordonnées:', lat, lng);

    const merchantData = {
      name: String(name).trim(),
      name_lowercase: String(name).trim().toLowerCase(),
      description: description ? String(description) : '',
      category: String(category),
      address: String(address),
      // Sauvegarder les champs séparés de l'adresse pour éviter "Adresse non spécifiée"
      addressLine1: addressLine1 ? String(addressLine1).trim() : null,
      city: city ? String(city).trim() : null,
      postalCode: postalCode ? String(postalCode).trim() : null,
      countryCode: countryCode ? String(countryCode).trim() : null,
      phone: phone ? String(phone) : null,
      email: email ? String(email) : null,
      website: website ? String(website) : null,
      socialMedia: socialMedia || {},
      location: new admin.firestore.GeoPoint(lat, lng),
      images: Array.isArray(images) ? images.slice(0, 10).map(String) : [],
      owner_user_id: userId,
      isActive: true,
      isVerified: false,
      rating: 0,
      reviewCount: 0,
      totalSales: 0,
      // ✅ Ajouter le champ stats pour l'app Flutter
      stats: {
        totalProducts: 0,
        totalFollowers: 0,
        totalReviews: 0,
        averageRating: 0.0,
        totalViews: 0,
        totalSales: 0,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    console.log('[createMerchant] Écriture du document marchand...');
    const merchantRef = await admin.firestore()
      .collection('merchants')
      .add(merchantData);

    // ✅ Le champ stats est déjà créé dans merchantData (ligne 111-118)
    // Conserver la sous-collection pour compatibilité si nécessaire
    await merchantRef.collection('stats').doc('summary').set({
      viewCount: 0,
      favoriteCount: 0,
      productCount: 0,
      offerCount: 0,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Mettre à jour le rôle de l'utilisateur (upsert pour éviter l'échec si le doc n'existe pas)
    await admin.firestore().collection('users').doc(userId).set({
      role: 'storeOwner',
      merchantId: merchantRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return {
      success: true,
      merchantId: merchantRef.id,
    };
  } catch (error) {
    console.error('Erreur création marchand:', error);
    // Propager les erreurs connues, sinon renvoyer le message d'origine pour debug
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError(
      'internal',
      'Erreur lors de la création du marchand',
      {
        message: error && error.message ? String(error.message) : null,
        code: error && error.code ? String(error.code) : null,
        stack: error && error.stack ? String(error.stack).split('\n').slice(0, 5).join('\n') : null,
      }
    );
  }
});

/**
 * Mettre à jour un marchand
 */
exports.updateMerchant = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = request.auth.uid;
  const { merchantId, updates } = request.data;

  if (!merchantId) {
    throw new HttpsError('invalid-argument', 'merchantId requis');
  }

  try {
    const merchantRef = admin.firestore().collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();

    if (!merchantDoc.exists) {
      throw new HttpsError('not-found', 'Marchand non trouvé');
    }

    const merchantData = merchantDoc.data();

    // Vérifier les permissions (propriétaire ou admin)
    const isAdmin = await checkIsAdmin(userId);
    if (merchantData.owner_user_id !== userId && !isAdmin) {
      throw new HttpsError('permission-denied', 'Non autorisé');
    }

    // Champs autorisés à la modification
    const allowedFields = [
      'name', 'description', 'type', 'category', 'address', 'addressLine1', 'city', 'countryCode',
      'phone', 'email', 'website', 'siret', 'socialMedia', 'location', 'images', 'isActive',
      'messageEnabled', 'banner_url', 'iban', 'bic', 'paymentPreference'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        if (field === 'location' && updates.location) {
          const lat = updates.location.latitude;
          const lng = updates.location.longitude;

          updateData.location = new admin.firestore.GeoPoint(lat, lng);
          console.log('[updateMerchant] Localisation mise à jour');
        } else if (field === 'images' && Array.isArray(updates.images)) {
          updateData.images = updates.images.slice(0, 10);
        } else {
          updateData[field] = updates[field];
        }
      }
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await merchantRef.update(updateData);

    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour marchand:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erreur lors de la mise à jour');
  }
});

/**
 * Supprimer un marchand (soft delete)
 */
exports.deleteMerchant = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = request.auth.uid;
  const { merchantId } = request.data;

  if (!merchantId) {
    throw new HttpsError('invalid-argument', 'merchantId requis');
  }

  try {
    const merchantRef = admin.firestore().collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();

    if (!merchantDoc.exists) {
      throw new HttpsError('not-found', 'Marchand non trouvé');
    }

    const merchantData = merchantDoc.data();

    // Vérifier permissions (admin uniquement)
    const isAdmin = await checkIsAdmin(userId);
    if (!isAdmin) {
      throw new HttpsError('permission-denied', 'Seuls les admins peuvent supprimer');
    }

    // Soft delete
    await merchantRef.update({
      isActive: false,
      isDeleted: true,
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedBy: userId,
    });

    // Mettre à jour le rôle de l'utilisateur propriétaire
    if (merchantData.owner_user_id) {
      await admin.firestore().collection('users').doc(merchantData.owner_user_id).update({
        role: 'user',
        merchantId: admin.firestore.FieldValue.delete(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Erreur suppression marchand:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erreur lors de la suppression');
  }
});

// =========================================
// GESTION DES PRODUITS
// =========================================

/**
 * Créer un produit anti-gaspillage
 * Retourne l'ID du produit créé
 */
exports.createProduct = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = request.auth.uid;
  const {
    merchantId,
    title,
    description,
    originalPrice,
    discountedPrice,
    quantity,
    maxPerUser,
    pickupStart,
    pickupEnd,
    dietaryTags,
    allergenTags,
    categoryIds,
    images,
    status,
    expiresAt,
    category,
    subcategory,
    weightGrams,
    surpriseDescription,
    isSurpriseBox,
    co2SavedGrams,
    pickupInstructions,
  } = request.data;

  // Utilitaires
  const parseTs = (v) => {
    if (!v) return null;
    try {
      if (typeof v === 'string') {
        const d = new Date(v);
        return isNaN(d.getTime()) ? null : admin.firestore.Timestamp.fromDate(d);
      }
      if (typeof v === 'number') {
        return admin.firestore.Timestamp.fromMillis(v);
      }
      if (v._seconds) {
        return new admin.firestore.Timestamp(v._seconds, v._nanoseconds || 0);
      }
      return null;
    } catch (_) {
      return null;
    }
  };

  const normalizeStatus = (s) => {
    if (!s) return 'available';
    const v = String(s);
    switch (v) {
      case 'available':
        return 'available';
      case 'sold_out':
      case 'soldOut':
      case 'sold-out':
        return 'sold-out';
      case 'reserved':
      case 'scheduled':
        return 'scheduled';
      case 'hidden':
      case 'archived':
        return 'archived';
      case 'expired':
        return 'expired';
      default:
        return 'available';
    }
  };

  if (!merchantId || !title || originalPrice == null || discountedPrice == null) {
    throw new HttpsError(
      'invalid-argument',
      'merchantId, titre, prix original et prix réduit requis'
    );
  }

  // Validation: prix réduit < prix original
  if (parseFloat(discountedPrice) >= parseFloat(originalPrice)) {
    throw new HttpsError(
      'invalid-argument',
      'Le prix réduit doit être inférieur au prix original'
    );
  }
  try {
    // Résoudre le merchantId de façon robuste
    let resolvedMerchantId = merchantId || null;
    if (!resolvedMerchantId) {
      const userSnap = await admin.firestore().collection('users').doc(userId).get();
      if (userSnap.exists && userSnap.get('merchantId')) {
        resolvedMerchantId = userSnap.get('merchantId');
      }
    }

    let merchantRef = null;
    let merchantDoc = null;

    if (resolvedMerchantId) {
      merchantRef = admin.firestore().collection('merchants').doc(resolvedMerchantId);
      merchantDoc = await merchantRef.get();
    }

    // Si toujours introuvable, tenter via owner_user_id
    if (!merchantDoc || !merchantDoc.exists) {
      const q = await admin.firestore()
        .collection('merchants')
        .where('owner_user_id', '==', userId)
        .limit(1)
        .get();
      if (!q.empty) {
        merchantRef = q.docs[0].ref;
        merchantDoc = await merchantRef.get();
        resolvedMerchantId = merchantRef.id;
      }
    }

    if (!merchantDoc || !merchantDoc.exists) {
      throw new HttpsError('not-found', 'Marchand non trouvé');
    }

    if (merchantDoc.data().owner_user_id !== userId) {
      throw new HttpsError('permission-denied', 'Non autorisé');
    }

    // Prix au format Money (amount_minor + currency_code)
    const toMinor = (v) => Math.round(parseFloat(v) * 100);
    const currencyCode = 'EUR';

    // Images au format attendu par le modèle
    const imagesInput = Array.isArray(images) ? images.slice(0, 10) : [];
    const imageDocs = imagesInput
      .map((img, idx) => {
        if (typeof img === 'string') {
          return { url: img, is_primary: idx === 0, alt: null, width: null, height: null };
        }
        if (img && typeof img === 'object') {
          return {
            url: String(img.url ?? img.href ?? ''),
            is_primary: Boolean(img.is_primary ?? img.isPrimary ?? idx === 0),
            alt: img.alt ? String(img.alt) : null,
            width: img.width != null ? parseInt(img.width) : null,
            height: img.height != null ? parseInt(img.height) : null,
          };
        }
        return null;
      })
      .filter(Boolean);

    // Générer automatiquement un SKU unique
    const generateSKU = async () => {
      try {
        // Récupérer les infos du marchand pour créer le préfixe
        const merchantDoc = await merchantRef.get();
        const merchantData = merchantDoc.data();

        // Créer un préfixe basé sur le nom du marchand (3 premières lettres en majuscules)
        let prefix = 'PRD'; // Préfixe par défaut
        if (merchantData && merchantData.business_name) {
          const name = String(merchantData.business_name).replace(/[^a-zA-Z]/g, '').toUpperCase();
          prefix = name.substring(0, 3).padEnd(3, 'X');
        }

        // Date au format YYYYMMDD
        const now = new Date();
        const dateStr = now.getFullYear().toString() +
          String(now.getMonth() + 1).padStart(2, '0') +
          String(now.getDate()).padStart(2, '0');

        // Générer un numéro unique avec timestamp + random
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

        const sku = `${prefix}-${dateStr}-${random}`;

        // Vérifier l'unicité du SKU pour ce marchand
        const existingProduct = await merchantRef.collection('products')
          .where('sku', '==', sku)
          .limit(1)
          .get();

        if (!existingProduct.empty) {
          // Si collision, régénérer avec un nouveau random
          const newRandom = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          return `${prefix}-${dateStr}-${newRandom}`;
        }

        return sku;
      } catch (error) {
        console.error('Erreur génération SKU:', error);
        // Fallback: générer un SKU simple avec timestamp
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        return `PRD-${timestamp}-${random}`;
      }
    };

    // Générer le SKU automatiquement
    const sku = await generateSKU();

    const productData = {
      merchantId: resolvedMerchantId,
      title: String(title).trim(),
      description: description ? String(description) : '',
      sku: sku, // SKU généré automatiquement
      original_price: { amount_minor: toMinor(originalPrice), currency_code: currencyCode },
      discounted_price: { amount_minor: toMinor(discountedPrice), currency_code: currencyCode },
      quantity: Number.isInteger(quantity) ? quantity : (quantity ? parseInt(quantity) : 1),
      max_per_user: maxPerUser != null ? parseInt(maxPerUser) : null,
      pickup_start: parseTs(pickupStart),
      pickup_end: parseTs(pickupEnd),
      dietary_tags: Array.isArray(dietaryTags) ? dietaryTags.map(String) : [],
      allergen_tags: Array.isArray(allergenTags) ? allergenTags.map(String) : [],
      // categoryIds n'est pas consommé par le modèle actuel mais on le conserve pour évolutions
      categoryIds: Array.isArray(categoryIds) ? categoryIds.map(String) : [],
      images: imageDocs,
      status: normalizeStatus(status),
      expires_at: parseTs(expiresAt),
      category: category != null ? String(category) : null,
      subcategory: subcategory != null ? String(subcategory) : null,
      weight_grams: weightGrams != null ? parseFloat(weightGrams) : null,
      surprise_description: surpriseDescription != null ? String(surpriseDescription) : null,
      is_surprise_box: Boolean(isSurpriseBox),
      co2_saved_grams: co2SavedGrams != null ? parseInt(co2SavedGrams) : null,
      pickup_instructions: pickupInstructions != null ? String(pickupInstructions) : null,
      view_count: 0,
      purchase_count: 0,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    };

    const productRef = await merchantRef.collection('products').add(productData);

    // ✅ Mettre à jour stats.totalProducts dans le document marchand (nouveau format)
    await merchantRef.update({
      'stats.totalProducts': admin.firestore.FieldValue.increment(1)
    });

    // Conserver l'ancien format pour compatibilité
    await merchantRef.collection('stats').doc('summary').update({
      productCount: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      productId: productRef.id,
    };
  } catch (error) {
    console.error('Erreur création produit:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erreur lors de la création du produit');
  }
});

/**
 * Mettre à jour un produit
 */
exports.updateProduct = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = request.auth.uid;
  const { merchantId, productId, updates } = request.data;

  if (!merchantId || !productId) {
    throw new HttpsError('invalid-argument', 'merchantId et productId requis');
  }

  try {
    const merchantRef = admin.firestore().collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();

    if (!merchantDoc.exists) {
      throw new HttpsError('not-found', 'Marchand non trouvé');
    }

    if (merchantDoc.data().owner_user_id !== userId) {
      throw new HttpsError('permission-denied', 'Non autorisé');
    }

    const productRef = merchantRef.collection('products').doc(productId);
    const productDoc = await productRef.get();

    if (!productDoc.exists) {
      throw new HttpsError('not-found', 'Produit non trouvé');
    }

    const allowedFields = [
      'title', 'description', 'original_price', 'discounted_price',
      'category', 'images', 'quantity', 'status', 'expires_at',
      'dietary_tags', 'allergen_tags', 'pickup_start', 'pickup_end',
      'max_per_user', 'is_surprise_box', 'surprise_description',
      'co2_saved_grams', 'pickup_instructions', 'weight_grams', 'categoryIds'
    ];

    const toMinor = (v) => Math.round(parseFloat(v) * 100);
    const currencyCode = 'EUR';

    const updateData = {};
    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(updates, field)) {
        const value = updates[field];
        if (field === 'images' && Array.isArray(value)) {
          updateData.images = value.slice(0, 10).map((img, idx) => {
            if (typeof img === 'string') {
              return { url: img, is_primary: idx === 0, alt: null, width: null, height: null };
            }
            return {
              url: String(img.url ?? img.href ?? ''),
              is_primary: Boolean(img.is_primary ?? img.isPrimary ?? idx === 0),
              alt: img.alt ? String(img.alt) : null,
              width: img.width != null ? parseInt(img.width) : null,
              height: img.height != null ? parseInt(img.height) : null,
            };
          });
        } else if ((field === 'original_price' || field === 'discounted_price') && value != null) {
          // Autoriser nombre ou objet {amount_minor, currency_code}
          if (typeof value === 'number' || typeof value === 'string') {
            updateData[field] = { amount_minor: toMinor(value), currency_code: currencyCode };
          } else if (typeof value === 'object' && value.amount_minor != null) {
            updateData[field] = {
              amount_minor: parseInt(value.amount_minor),
              currency_code: String(value.currency_code ?? currencyCode),
            };
          }
        } else if (field === 'status') {
          updateData.status = normalizeStatus(value);
        } else if (field === 'expires_at' || field === 'pickup_start' || field === 'pickup_end') {
          updateData[field] = parseTs(value);
        } else {
          updateData[field] = value;
        }
      }
    }

    updateData.updated_at = admin.firestore.FieldValue.serverTimestamp();

    await productRef.update(updateData);

    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour produit:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erreur lors de la mise à jour');
  }
});

/**
 * Supprimer un produit
 */
exports.deleteProduct = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = request.auth.uid;
  const { merchantId, productId } = request.data;

  if (!merchantId || !productId) {
    throw new HttpsError('invalid-argument', 'merchantId et productId requis');
  }

  try {
    const merchantRef = admin.firestore().collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();

    if (!merchantDoc.exists) {
      throw new HttpsError('not-found', 'Marchand non trouvé');
    }

    const isAdmin = await checkIsAdmin(userId);
    if (merchantDoc.data().owner_user_id !== userId && !isAdmin) {
      throw new HttpsError('permission-denied', 'Non autorisé');
    }

    const productRef = merchantRef.collection('products').doc(productId);
    await productRef.delete();

    // ✅ Mettre à jour stats.totalProducts dans le document marchand (nouveau format)
    await merchantRef.update({
      'stats.totalProducts': admin.firestore.FieldValue.increment(-1)
    });

    // Conserver l'ancien format pour compatibilité
    await merchantRef.collection('stats').doc('summary').update({
      productCount: admin.firestore.FieldValue.increment(-1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur suppression produit:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erreur lors de la suppression');
  }
});

// =========================================
// GESTION DES OFFRES
// =========================================

/**
 * Créer une offre
 */
exports.createOffer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = request.auth.uid;
  const {
    merchantId,
    title,
    description,
    type,
    value,
    minPurchase,
    maxDiscount,
    validFrom,
    validUntil,
    usageLimit,
    terms,
  } = request.data;

  if (!merchantId || !title || !type || !validUntil) {
    throw new HttpsError(
      'invalid-argument',
      'merchantId, titre, type et date de validité requis'
    );
  }

  try {
    const merchantRef = admin.firestore().collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();

    if (!merchantDoc.exists) {
      throw new HttpsError('not-found', 'Marchand non trouvé');
    }

    if (merchantDoc.data().owner_user_id !== userId) {
      throw new HttpsError('permission-denied', 'Non autorisé');
    }

    const offerData = {
      merchantId: merchantId,
      title: title.trim(),
      description: description || '',
      type: type, // 'percentage', 'fixed', 'free_item', 'buy_x_get_y'
      value: value || 0,
      minPurchase: minPurchase || 0,
      maxDiscount: maxDiscount || null,
      validFrom: validFrom || admin.firestore.FieldValue.serverTimestamp(),
      validUntil: validUntil,
      usageLimit: usageLimit || null,
      usageCount: 0,
      terms: terms || '',
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const offerRef = await merchantRef.collection('offers').add(offerData);

    // Note: Les offres ne sont pas stockées dans stats (pas de champ totalOffers dans MerchantStats)
    // On peut garder l'ancien compteur dans la sous-collection pour référence
    await merchantRef.collection('stats').doc('summary').update({
      offerCount: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      offerId: offerRef.id,
    };
  } catch (error) {
    console.error('Erreur création offre:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erreur lors de la création de l\'offre');
  }
});

/**
 * Mettre à jour une offre
 */
exports.updateOffer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = request.auth.uid;
  const { merchantId, offerId, updates } = request.data;

  if (!merchantId || !offerId) {
    throw new HttpsError('invalid-argument', 'merchantId et offerId requis');
  }

  try {
    const merchantRef = admin.firestore().collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();

    if (!merchantDoc.exists) {
      throw new HttpsError('not-found', 'Marchand non trouvé');
    }

    if (merchantDoc.data().owner_user_id !== userId) {
      throw new HttpsError('permission-denied', 'Non autorisé');
    }

    const offerRef = merchantRef.collection('offers').doc(offerId);
    const offerDoc = await offerRef.get();

    if (!offerDoc.exists) {
      throw new HttpsError('not-found', 'Offre non trouvée');
    }

    const allowedFields = [
      'title', 'description', 'type', 'value', 'minPurchase',
      'maxDiscount', 'validFrom', 'validUntil', 'usageLimit', 'terms', 'isActive'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (updates.hasOwnProperty(field)) {
        updateData[field] = updates[field];
      }
    }

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await offerRef.update(updateData);

    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour offre:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erreur lors de la mise à jour');
  }
});

/**
 * Supprimer une offre
 */
exports.deleteOffer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = request.auth.uid;
  const { merchantId, offerId } = request.data;

  if (!merchantId || !offerId) {
    throw new HttpsError('invalid-argument', 'merchantId et offerId requis');
  }

  try {
    const merchantRef = admin.firestore().collection('merchants').doc(merchantId);
    const merchantDoc = await merchantRef.get();

    if (!merchantDoc.exists) {
      throw new HttpsError('not-found', 'Marchand non trouvé');
    }

    const isAdmin = await checkIsAdmin(userId);
    if (merchantDoc.data().owner_user_id !== userId && !isAdmin) {
      throw new HttpsError('permission-denied', 'Non autorisé');
    }

    const offerRef = merchantRef.collection('offers').doc(offerId);
    await offerRef.delete();

    // Note: Les offres ne sont pas stockées dans stats (pas de champ totalOffers dans MerchantStats)
    // On peut garder l'ancien compteur dans la sous-collection pour référence
    await merchantRef.collection('stats').doc('summary').update({
      offerCount: admin.firestore.FieldValue.increment(-1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur suppression offre:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erreur lors de la suppression');
  }
});

// =========================================
// FONCTIONS UTILITAIRES
// =========================================

/**
 * Vérifier si un utilisateur est admin
 * Importe depuis auth.js pour centraliser la logique
 */
const authModule = require('./auth');
const checkIsAdmin = authModule.checkIsAdmin;

/**
 * Incrémenter le compteur de vues d'un marchand
 */
exports.incrementMerchantViews = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const { merchantId } = request.data;

  if (!merchantId) {
    throw new HttpsError('invalid-argument', 'merchantId requis');
  }

  try {
    const merchantRef = admin.firestore().collection('merchants').doc(merchantId);

    // ✅ Mettre à jour stats.totalViews dans le document marchand (nouveau format)
    await merchantRef.update({
      'stats.totalViews': admin.firestore.FieldValue.increment(1)
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur incrémentation vues:', error);
    throw new HttpsError('internal', 'Erreur lors de l\'incrémentation');
  }
});

/**
 * Corriger les rôles des marchands existants (fonction admin uniquement)
 * Utilise le script fix_merchant_roles.js pour corriger les permissions
 */
exports.fixMerchantRoles = onCall(async (request) => {
  // Vérifier que l'utilisateur est admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  // Vérifier le rôle admin (via Firestore)
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(request.auth.uid)
    .get();

  if (!userDoc.exists) {
    throw new HttpsError('permission-denied', 'Utilisateur non trouvé');
  }

  const userData = userDoc.data();
  const userRole = userData.role;

  if (userRole !== 'admin') {
    throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs');
  }

  console.log(`🔧 [ADMIN] Correction des rôles marchands demandée par ${request.auth.uid}`);

  try {
    // Exécuter la correction des rôles
    await fixMerchantRoles();

    return {
      success: true,
      message: 'Correction des rôles marchands terminée'
    };
  } catch (error) {
    console.error('Erreur lors de la correction des rôles:', error);
    throw new HttpsError('internal', 'Erreur lors de la correction des rôles');
  }
});
