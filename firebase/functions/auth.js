const admin = require('firebase-admin');
const { onCall } = require('firebase-functions/v2/https');
const { HttpsError } = require('firebase-functions/https');
const functionsV1 = require('firebase-functions/v1');

// =========================================
// GESTION AUTHENTIFICATION ET UTILISATEURS
// =========================================

/**
 * Formate un nom d'affichage à partir d'un email
 * Exemple: "conde.sidiki@example.com" -> "Conde Sidiki"
 */
function formatDisplayNameFromEmail(email) {
  if (!email || typeof email !== 'string') return '';

  // Prendre la partie avant @
  const username = email.split('@')[0];

  // Remplacer les séparateurs communs (., _, -) par des espaces
  const nameParts = username
    .replace(/[._-]/g, ' ')
    .split(' ')
    .filter(part => part.length > 0);

  // Capitaliser chaque partie du nom
  return nameParts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Trigger automatique lors de la création d'un utilisateur Firebase Auth
 * Crée le document utilisateur dans Firestore avec les données de base
 */
exports.onUserCreate = functionsV1.auth.user().onCreate(async (user) => {
  const userId = user.uid;
  const email = user.email || null;
  const displayName = user.displayName || null;
  const photoURL = user.photoURL || null;
  const phoneNumber = user.phoneNumber || null;

  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);

    // Vérifier si le document existe déjà (au cas où)
    const existingDoc = await userRef.get();
    if (existingDoc.exists) {
      console.log(`Document utilisateur ${userId} existe déjà, skip création`);
      return null;
    }

    // Créer le document utilisateur avec les données de base
    const userData = {
      id: userId,
      email: email,
      displayName: displayName || formatDisplayNameFromEmail(email),
      photoURL: photoURL || null,
      phoneNumber: phoneNumber || null,
      role: 'user', // Rôle par défaut (sera changé en 'storeOwner' lors de la création d'un marchand)
      merchantId: null, // Sera rempli lors de la création d'un marchand
      isActive: true,
      isVerified: false,
      emailVerified: user.emailVerified || false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),

      // Préférences par défaut
      preferences: {
        language: 'fr',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
        theme: 'light',
      },

      // Statistiques initiales
      stats: {
        postsCount: 0,
        followersCount: 0,
        followingCount: 0,
        ordersCount: 0,
      },

      // Device token pour les notifications push (sera mis à jour par l'app)
      deviceToken: null,

      // Localisation (sera mise à jour par l'app)
      location: null,

      // Panier et favoris
      basket: [],
      favorites: {
        merchants: [],
        products: [],
        posts: [],
      },

      // Historique de recherche
      searchHistory: [],

      // Adresses enregistrées
      savedAddresses: [],
    };

    await userRef.set(userData);

    console.log(`Document utilisateur créé pour ${userId} (${email})`);

    // Créer une collection de notifications vide pour l'utilisateur
    await userRef.collection('notifications').doc('_placeholder').set({
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      placeholder: true,
    });

    return null;
  } catch (error) {
    console.error('Erreur lors de la création du document utilisateur:', error);
    // Ne pas throw l'erreur pour ne pas bloquer la création du compte Auth
    // L'app pourra créer le document manuellement si nécessaire
    return null;
  }
});

/**
 * Trigger automatique lors de la suppression d'un utilisateur Firebase Auth
 * Nettoie toutes les données associées dans Firestore
 */
exports.onUserDelete = functionsV1.auth.user().onDelete(async (user) => {
  const userId = user.uid;

  try {
    const db = admin.firestore();
    const batch = db.batch();

    // Supprimer le document utilisateur
    const userRef = db.collection('users').doc(userId);
    batch.delete(userRef);

    // Supprimer le profil dans la collection profiles
    const profileRef = db.collection('profiles').doc(userId);
    batch.delete(profileRef);

    // Supprimer les notifications de l'utilisateur
    const notificationsSnapshot = await db.collection('notifications')
      .where('recipientId', '==', userId)
      .get();

    notificationsSnapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Supprimer les posts de l'utilisateur
    const postsSnapshot = await db.collection('posts')
      .where('authorId', '==', userId)
      .get();

    for (const postDoc of postsSnapshot.docs) {
      // Supprimer les commentaires du post
      const commentsSnapshot = await postDoc.ref.collection('comments').get();
      commentsSnapshot.forEach(commentDoc => {
        batch.delete(commentDoc.ref);
      });

      // Supprimer les réactions du post
      const reactionsSnapshot = await postDoc.ref.collection('reactions').get();
      reactionsSnapshot.forEach(reactionDoc => {
        batch.delete(reactionDoc.ref);
      });

      // Supprimer le post
      batch.delete(postDoc.ref);
    }

    // Désactiver le marchand si l'utilisateur en possède un
    const merchantsSnapshot = await db.collection('merchants')
      .where('owner_user_id', '==', userId)
      .get();

    merchantsSnapshot.forEach(merchantDoc => {
      batch.update(merchantDoc.ref, {
        isActive: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletionReason: 'owner_account_deleted',
      });
    });

    await batch.commit();

    console.log(`Nettoyage terminé pour l'utilisateur ${userId}`);
    return null;
  } catch (error) {
    console.error('Erreur lors du nettoyage des données utilisateur:', error);
    return null;
  }
});

/**
 * Cloud Function callable pour mettre à jour le profil utilisateur
 */
exports.updateUserProfile = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = request.auth.uid;
  const { displayName, photoURL, phoneNumber, preferences, location } = request.data;

  try {
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new HttpsError('not-found', 'Utilisateur non trouvé');
    }

    const updateData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (displayName !== undefined) updateData.displayName = displayName;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (preferences !== undefined) updateData.preferences = preferences;
    if (location !== undefined) {
      updateData.location = location ? new admin.firestore.GeoPoint(
        location.latitude,
        location.longitude
      ) : null;
    }

    await userRef.update(updateData);

    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Erreur lors de la mise à jour du profil');
  }
});

/**
 * Cloud Function callable pour mettre à jour le device token (notifications push)
 */
exports.updateDeviceToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }

  const userId = request.auth.uid;
  const { deviceToken } = request.data;

  if (!deviceToken || typeof deviceToken !== 'string') {
    throw new HttpsError('invalid-argument', 'Device token requis');
  }

  try {
    await admin.firestore().collection('users').doc(userId).update({
      deviceToken: deviceToken,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Erreur mise à jour device token:', error);
    throw new HttpsError('internal', 'Erreur lors de la mise à jour du token');
  }
});

/**
 * Fonction helper pour vérifier si un utilisateur est admin
 * (utilisée par d'autres modules)
 */
exports.checkIsAdmin = async (userId) => {
  const userDoc = await admin.firestore().collection('users').doc(userId).get();
  if (!userDoc.exists) return false;
  const userData = userDoc.data();
  return userData.role === 'admin' || userData.role === 'superadmin';
};
