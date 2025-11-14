const { onCall } = require('firebase-functions/v2/https');
const { HttpsError } = require('firebase-functions/https');
const { onDocumentWritten, onDocumentDeleted, onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

// Modules
const authModule = require('./auth');

// Utilities
const db = admin.firestore();

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
  }
  return request.auth.uid;
}

async function isPostOwner(postId, uid) {
  const snap = await db.collection('posts').doc(postId).get();
  if (!snap.exists) return false;
  return snap.get('authorId') === uid;
}

// =============================
// Posts - Callables
// =============================
exports.createPost = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const {
    content = '',
    imageUrls = [],
    hashtags = [],
    storeId = null,
    storeName = null,
    city = null,
    postalCode = null,
    latitude = null,
    longitude = null,
    type = 'text',
  } = data || {};

  if (typeof content !== 'string' || content.length === 0) {
    throw new HttpsError('invalid-argument', 'Contenu requis');
  }

  // Récupérer les informations de l'utilisateur
  const userDoc = await db.collection('users').doc(uid).get();
  if (!userDoc.exists) {
    throw new HttpsError('not-found', 'Utilisateur non trouvé');
  }
  const userData = userDoc.data();
  const authorName = userData.displayName || userData.email || 'Utilisateur';

  const now = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection('posts').doc();
  const post = {
    id: docRef.id,
    authorId: uid,
    authorName: authorName,
    content: content.slice(0, 2000),
    imageUrls: Array.isArray(imageUrls) ? imageUrls.slice(0, 10) : [],
    hashtags: Array.isArray(hashtags) ? hashtags.slice(0, 20) : [],
    storeId,
    storeName,
    city,
    postalCode,
    latitude,
    longitude,
    type,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    isRepost: false,
    createdAt: now,
    updatedAt: now,
  };

  await docRef.set(post);

  // ✅ Mettre à jour le compteur de posts de l'utilisateur
  await db.collection('users').doc(uid).update({
    sharedProductIds: admin.firestore.FieldValue.arrayUnion(docRef.id)
  });

  return { postId: docRef.id };
});

exports.updatePost = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const { postId, updates = {} } = data || {};
  if (!postId) throw new HttpsError('invalid-argument', 'postId requis');
  const owner = await isPostOwner(postId, uid);
  if (!owner) throw new HttpsError('permission-denied', 'Non autorisé');

  const safe = {};
  if (typeof updates.content === 'string') safe.content = updates.content.slice(0, 2000);
  if (Array.isArray(updates.imageUrls)) safe.imageUrls = updates.imageUrls.slice(0, 10);
  if (Array.isArray(updates.hashtags)) safe.hashtags = updates.hashtags.slice(0, 20);
  safe.updatedAt = admin.firestore.FieldValue.serverTimestamp();

  await db.collection('posts').doc(postId).update(safe);
  return { success: true };
});

exports.deletePost = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const { postId, isModerator = false } = data || {};
  if (!postId) throw new HttpsError('invalid-argument', 'postId requis');

  // Check permissions: either post owner or moderator/admin
  const owner = await isPostOwner(postId, uid);
  const isAdmin = await authModule.checkIsAdmin(uid);

  if (!owner && !isAdmin && !isModerator) {
    throw new HttpsError('permission-denied', 'Non autorisé');
  }

  // Récupérer l'auteur du post avant de le supprimer
  const postDoc = await db.collection('posts').doc(postId).get();
  const authorId = postDoc.exists ? postDoc.data().authorId : null;

  // Delete post
  await db.collection('posts').doc(postId).delete();

  // ✅ Retirer le post du compteur de l'utilisateur
  if (authorId) {
    await db.collection('users').doc(authorId).update({
      sharedProductIds: admin.firestore.FieldValue.arrayRemove(postId)
    });
  }

  // Cleanup top-level comments and reactions referencing this post
  const batch = db.batch();
  const commentsSnap = await db.collection('comments').where('postId', '==', postId).get();
  commentsSnap.forEach((doc) => batch.delete(doc.ref));
  const reactionsSnap = await db.collection('reactions').where('targetType', '==', 'post').where('targetId', '==', postId).get();
  reactionsSnap.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();

  return { success: true };
});

exports.pinPost = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const { postId, pinned } = data || {};
  if (!postId || typeof pinned !== 'boolean') {
    throw new HttpsError('invalid-argument', 'postId et pinned requis');
  }
  const owner = await isPostOwner(postId, uid);
  if (!owner) throw new HttpsError('permission-denied', 'Non autorisé');

  await db.collection('posts').doc(postId).update({
    isPinned: pinned,
    pinnedAt: pinned ? admin.firestore.FieldValue.serverTimestamp() : null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});

exports.repostPost = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const { originalPostId, repostContent = null } = data || {};
  if (!originalPostId) {
    throw new HttpsError('invalid-argument', 'originalPostId requis');
  }
  const original = await db.collection('posts').doc(originalPostId).get();
  if (!original.exists) throw new HttpsError('not-found', 'Post original introuvable');

  const now = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection('posts').doc();
  await docRef.set({
    id: docRef.id,
    authorId: uid,
    type: original.get('type'),
    content: original.get('content'),
    imageUrls: original.get('imageUrls') || [],
    hashtags: original.get('hashtags') || [],
    isRepost: true,
    originalPostId,
    repostContent: repostContent ? String(repostContent).slice(0, 500) : null,
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
    viewsCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  return { postId: docRef.id };
});

exports.incrementPostViews = onCall(async (request) => {
  requireAuth(request);
  const data = request.data;
  const { postId } = data || {};
  if (!postId) throw new HttpsError('invalid-argument', 'postId requis');
  await db.collection('posts').doc(postId).update({
    viewsCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});

exports.incrementPostShares = onCall(async (request) => {
  requireAuth(request);
  const data = request.data;
  const { postId } = data || {};
  if (!postId) throw new HttpsError('invalid-argument', 'postId requis');
  await db.collection('posts').doc(postId).update({
    sharesCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return { success: true };
});

// =============================
// Comments - Callables
// =============================
exports.createComment = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const { postId, content, parentCommentId = null } = data || {};
  if (!postId || typeof content !== 'string' || content.length === 0) {
    throw new HttpsError('invalid-argument', 'postId et contenu requis');
  }
  const now = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection('comments').doc();
  await docRef.set({
    id: docRef.id,
    postId,
    authorId: uid,
    content: content.slice(0, 1000),
    parentCommentId,
    likesCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  // update post comments count (top-level only)
  if (!parentCommentId) {
    await db.collection('posts').doc(postId).update({
      commentsCount: admin.firestore.FieldValue.increment(1),
      updatedAt: now,
    });
  }
  return { commentId: docRef.id };
});

exports.deleteComment = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const { postId, commentId } = data || {};
  if (!postId || !commentId) {
    throw new HttpsError('invalid-argument', 'postId et commentId requis');
  }
  const snap = await db.collection('comments').doc(commentId).get();
  if (!snap.exists) throw new HttpsError('not-found', 'Commentaire introuvable');
  if (snap.get('authorId') !== uid) {
    throw new HttpsError('permission-denied', 'Non autorisé');
  }
  await db.collection('comments').doc(commentId).delete();
  if (!snap.get('parentCommentId')) {
    await db.collection('posts').doc(postId).update({
      commentsCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
  return { success: true };
});

// =============================
// Reactions - Callables
// =============================
exports.addReaction = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const { targetId, targetType, type, postId = null } = data || {};
  if (!targetId || !targetType || !type) {
    throw new HttpsError('invalid-argument', 'Champs requis');
  }
  const docRef = db.collection('reactions').doc();
  const now = admin.firestore.FieldValue.serverTimestamp();
  await docRef.set({
    id: docRef.id,
    userId: uid,
    targetId,
    targetType,
    postId,
    type,
    createdAt: now,
  });
  return { reactionId: docRef.id };
});

exports.removeReaction = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const { targetId, targetType, type = null } = data || {};
  if (!targetId || !targetType) {
    throw new HttpsError('invalid-argument', 'targetId et targetType requis');
  }
  let query = db
    .collection('reactions')
    .where('userId', '==', uid)
    .where('targetId', '==', targetId)
    .where('targetType', '==', targetType);
  if (type) query = query.where('type', '==', type);
  const snap = await query.get();
  const batch = db.batch();
  snap.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  return { success: true };
});

// =============================
// Notifications - enqueue & updates
// =============================
exports.enqueueNotification = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const { type, recipientIds, payload, conversationId = null } = data || {};
  if (!type || !Array.isArray(recipientIds) || recipientIds.length === 0) {
    throw new HttpsError('invalid-argument', 'Paramètres invalides');
  }
  const now = admin.firestore.FieldValue.serverTimestamp();
  const docRef = db.collection('notification_requests').doc();
  await docRef.set({
    id: docRef.id,
    type,
    recipientIds,
    payload: payload || {},
    createdAt: now,
    status: 'pending',
    conversationId,
    senderId: uid,
  });
  return { requestId: docRef.id };
});

exports.markNotificationRead = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const { notificationId } = data || {};
  if (!notificationId) {
    throw new HttpsError('invalid-argument', 'notificationId requis');
  }
  const ref = db.collection('notifications').doc(notificationId);
  const snap = await ref.get();
  if (!snap.exists) throw new HttpsError('not-found', 'Notification introuvable');
  if (snap.get('recipientId') !== uid) {
    throw new HttpsError('permission-denied', 'Non autorisé');
  }
  await ref.update({ isRead: true, readAt: admin.firestore.FieldValue.serverTimestamp() });
  return { success: true };
});

exports.markAllNotificationsRead = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const snap = await db.collection('notifications').where('recipientId', '==', uid).where('isRead', '==', false).get();
  const batch = db.batch();
  snap.forEach((doc) => batch.update(doc.ref, { isRead: true, readAt: admin.firestore.FieldValue.serverTimestamp() }));
  await batch.commit();
  return { success: true };
});

exports.deleteNotification = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data;
  const { notificationId } = data || {};
  if (!notificationId) throw new HttpsError('invalid-argument', 'notificationId requis');
  const ref = db.collection('notifications').doc(notificationId);
  const snap = await ref.get();
  if (!snap.exists) return { success: true };
  if (snap.get('recipientId') !== uid) {
    throw new HttpsError('permission-denied', 'Non autorisé');
  }
  await ref.delete();
  return { success: true };
});

// =============================
// Triggers - aggregate counts & notifications
// =============================

// Traite les demandes de notifications (notification_requests)
exports.processNotificationRequests = onDocumentCreated('notification_requests/{requestId}', async (event) => {
  console.log('📬 processNotificationRequests triggered');
  const snapshot = event.data;
  if (!snapshot) return null;

  const data = snapshot.data();
  const requestRef = snapshot.ref;

  try {
    const recipientIds = Array.isArray(data.recipientIds) ? data.recipientIds : [];
    if (recipientIds.length === 0) {
      await requestRef.update({ status: 'skipped', reason: 'no_recipients' });
      console.log('⚠️ No recipients');
      return null;
    }

    console.log(`📨 Processing notification for ${recipientIds.length} recipients`);

    // Récupérer les tokens FCM des destinataires
    const tokens = [];
    const tokenUserMap = {};
    for (const uid of recipientIds) {
      const userDoc = await db.collection('users').doc(uid).get();
      const token = userDoc.exists ? userDoc.get('deviceToken') : null;
      if (token && typeof token === 'string') {
        tokens.push(token);
        tokenUserMap[token] = uid;
      }
    }

    console.log(`🔑 Found ${tokens.length} valid tokens`);

    if (tokens.length === 0) {
      await requestRef.update({ status: 'skipped', reason: 'no_tokens' });
      console.log('⚠️ No valid tokens');
      return null;
    }

    const payload = data.payload || {};

    // Construire le message FCM avec notification + data
    const notificationTitle = (payload.notification && payload.notification.title) ||
      _getNotificationTitleFromType(data.type);
    const notificationBody = (payload.notification && payload.notification.body) ||
      _getNotificationBodyFromType(data.type, payload.data || {});

    // Créer les notifications persistées dans Firestore
    const now = admin.firestore.FieldValue.serverTimestamp();
    const notificationDocs = [];

    for (const recipientId of recipientIds) {
      const notifRef = db.collection('notifications').doc();
      const notificationDoc = {
        id: notifRef.id,
        type: data.type || 'generic',
        recipientId: recipientId,
        title: notificationTitle,
        message: notificationBody,
        data: payload.data || {},
        createdAt: now,
        isRead: false,
        readAt: null,
        senderId: data.senderId || null,
        postId: (payload.data && payload.data.postId) || null,
        commentId: (payload.data && payload.data.commentId) || null,
        challengeId: (payload.data && payload.data.challengeId) || null,
        storeId: (payload.data && payload.data.storeId) || null,
        conversationId: data.conversationId || null,
      };

      notificationDocs.push(notifRef.set(notificationDoc));
    }

    await Promise.all(notificationDocs);
    console.log('✅ Notification documents created');

    // Envoyer les FCM avec notification + data
    const fcmMessage = {
      notification: {
        title: notificationTitle,
        body: notificationBody,
      },
      data: {
        type: data.type || 'generic',
        ...Object.fromEntries(
          Object.entries(payload.data || {}).map(([k, v]) => [k, String(v)])
        ),
      },
    };

    // Ajouter les options Android et iOS si présentes
    if (payload.android) {
      fcmMessage.android = payload.android;
    }
    if (payload.apns) {
      fcmMessage.apns = payload.apns;
    }

    // Envoyer en multicast
    const multicastMessage = {
      ...fcmMessage,
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(multicastMessage);
    console.log(`📱 FCM sent: ${response.successCount} success, ${response.failureCount} failures`);

    const successCount = response.successCount || 0;
    const failureCount = response.failureCount || 0;

    await requestRef.update({
      status: failureCount === 0 ? 'sent' : (successCount > 0 ? 'partial' : 'failed'),
      successCount,
      failureCount,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log('✅ Notification request processed');
    return null;

  } catch (error) {
    console.error('❌ Error processing notification request:', error);
    await requestRef.update({
      status: 'failed',
      error: error.message,
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return null;
  }
});

// Fonctions helper pour générer les titres et corps par défaut
function _getNotificationTitleFromType(type) {
  switch (type) {
    case 'message':
      return 'Nouveau message';
    case 'group_invite':
      return 'Invitation à un groupe';
    case 'group_message':
      return 'Nouveau message de groupe';
    case 'postLiked':
      return 'Nouveau like';
    case 'postCommented':
      return 'Nouveau commentaire';
    case 'newFollower':
      return 'Nouveau follower';
    default:
      return 'Nouvelle notification';
  }
}

function _getNotificationBodyFromType(type, data) {
  switch (type) {
    case 'message':
      return data.senderName ? `${data.senderName} vous a envoyé un message` : 'Vous avez un nouveau message';
    case 'group_invite':
      return data.groupName ? `Vous êtes invité à rejoindre ${data.groupName}` : 'Vous avez une invitation';
    case 'group_message':
      return data.groupName ? `Nouveau message dans ${data.groupName}` : 'Nouveau message de groupe';
    default:
      return 'Vous avez une nouvelle notification';
  }
}
exports.onReactionWrite = onDocumentWritten('reactions/{reactionId}', async (event) => {
  console.log('🔔 onReactionWrite triggered');
  const before = event.data.before ? event.data.before.data() : null;
  const after = event.data.after ? event.data.after.data() : null;
  const data = after || before;
  console.log('📊 Reaction data:', { before: !!before, after: !!after, data });
  if (!data) {
    console.log('❌ No data, returning');
    return null;
  }
  const { targetId, targetType, userId, type } = data;
  console.log('📝 Extracted:', { targetId, targetType, userId, type });
  if (!targetId || !targetType) {
    console.log('❌ Missing targetId or targetType');
    return null;
  }

  // Recalculate likes for posts and comments
  const snap = await db
    .collection('reactions')
    .where('targetId', '==', targetId)
    .where('targetType', '==', targetType)
    .get();
  const likesCount = snap.size;
  if (targetType === 'post') {
    await db.collection('posts').doc(targetId).update({ likesCount });
  } else if (targetType === 'comment') {
    await db.collection('comments').doc(targetId).update({ likesCount });
  }

  // Send notification for new likes (not for unlikes)
  // Only send notification if this is a new reaction (after exists, before doesn't)
  console.log('🔍 Checking notification conditions:', { hasAfter: !!after, hasBefore: !!before, type, userId });
  if (after && !before && type === 'like' && userId) {
    console.log('✅ Sending like notification');
    try {
      let recipientId = null;
      let notificationData = {};
      let notificationTitle = '';
      let notificationMessage = '';
      let notificationType = '';

      // Get liker info first
      console.log('👤 Getting user info for:', userId);
      const userSnap = await db.collection('users').doc(userId).get();
      if (!userSnap.exists) {
        console.log('❌ User not found:', userId);
        return null;
      }
      const userData = userSnap.data();
      const likerName = userData.displayName || userData.email || 'Un utilisateur';
      const likerPhotoUrl = userData.photoURL || null;
      console.log('✅ User found:', likerName);

      if (targetType === 'post') {
        // Get post author to send notification
        console.log('📝 Getting post:', targetId);
        const postSnap = await db.collection('posts').doc(targetId).get();
        if (!postSnap.exists) {
          console.log('❌ Post not found:', targetId);
          return null;
        }
        const postAuthorId = postSnap.get('authorId');
        console.log('👤 Post author:', postAuthorId);

        // Don't notify if user likes their own post
        if (postAuthorId === userId) {
          console.log('⚠️ User liked their own post, no notification');
          return null;
        }

        recipientId = postAuthorId;
        notificationType = 'postLiked';
        notificationTitle = 'Nouveau like';
        notificationMessage = `${likerName} a aimé votre publication`;
        notificationData = {
          likerId: userId,
          postId: targetId,
        };
        console.log('✅ Post notification prepared for:', recipientId);
      } else if (targetType === 'comment') {
        // Get comment author to send notification
        const commentSnap = await db.collection('comments').doc(targetId).get();
        if (!commentSnap.exists) return null;
        const commentAuthorId = commentSnap.get('authorId');
        const postId = commentSnap.get('postId');

        // Don't notify if user likes their own comment
        if (commentAuthorId === userId) return null;

        recipientId = commentAuthorId;
        notificationType = 'commentLiked';
        notificationTitle = 'Nouveau like';
        notificationMessage = `${likerName} a aimé votre commentaire`;
        notificationData = {
          likerId: userId,
          commentId: targetId,
          postId: postId,
        };
      }

      if (!recipientId) {
        console.log('❌ No recipient ID');
        return null;
      }

      // Create notification document
      console.log('💾 Creating notification document');
      const now = admin.firestore.FieldValue.serverTimestamp();
      const notifRef = db.collection('notifications').doc();
      const notificationDoc = {
        id: notifRef.id,
        type: notificationType,
        recipientId: recipientId,
        title: notificationTitle,
        message: notificationMessage,
        data: notificationData,
        createdAt: now,
        isRead: false,
        readAt: null,
        senderId: userId,
        senderName: likerName,
        senderPhotoUrl: likerPhotoUrl,
        postId: notificationData.postId || notificationData.likerId,
        commentId: notificationData.commentId || null,
      };
      console.log('📄 Notification document:', JSON.stringify(notificationDoc, null, 2));
      await notifRef.set(notificationDoc);
      console.log('✅ Notification created:', notifRef.id);

      // Send FCM push notification
      console.log('📱 Sending FCM notification');
      const authorSnap = await db.collection('users').doc(recipientId).get();
      if (authorSnap.exists) {
        const deviceToken = authorSnap.get('deviceToken');
        console.log('🔑 Device token exists:', !!deviceToken);
        if (deviceToken && typeof deviceToken === 'string') {
          try {
            await admin.messaging().send({
              token: deviceToken,
              notification: {
                title: notificationTitle,
                body: notificationMessage,
              },
              data: {
                type: notificationType,
                ...Object.fromEntries(Object.entries(notificationData).map(([k, v]) => [k, String(v)])),
              },
            });
            console.log('✅ FCM notification sent');
          } catch (fcmError) {
            console.error('❌ Erreur FCM:', fcmError);
            // Continue even if FCM fails
          }
        } else {
          console.log('⚠️ No valid device token');
        }
      } else {
        console.log('❌ Recipient user not found');
      }
    } catch (notifError) {
      console.error('❌ Erreur création notification like:', notifError);
      // Don't fail the whole function if notification fails
    }
  } else {
    console.log('⏭️ Skipping notification (conditions not met)');
  }

  return null;
});

exports.onCommentWrite = onDocumentWritten('comments/{commentId}', async (event) => {
  console.log('💬 onCommentWrite triggered');
  const after = event.data.after ? event.data.after.data() : null;
  const before = event.data.before ? event.data.before.data() : null;
  console.log('📊 Comment data:', { hasAfter: !!after, hasBefore: !!before });
  const postId = (after && after.postId) || (before && before.postId);
  if (!postId) {
    console.log('❌ No postId found');
    return null;
  }
  console.log('📝 PostId:', postId);

  // Count top-level comments
  const topSnap = await db
    .collection('comments')
    .where('postId', '==', postId)
    .where('parentCommentId', '==', null)
    .get();
  const commentsCount = topSnap.size;
  await db.collection('posts').doc(postId).update({ commentsCount });

  // If reply change, update repliesCount for that parent
  const parentId = after ? after.parentCommentId : before ? before.parentCommentId : null;
  if (parentId) {
    const replySnap = await db
      .collection('comments')
      .where('postId', '==', postId)
      .where('parentCommentId', '==', parentId)
      .get();
    await db.collection('comments').doc(parentId).update({ repliesCount: replySnap.size });
  }

  // Send notification for new comments
  console.log('🔍 Checking comment notification conditions:', { hasAfter: !!after, hasBefore: !!before, authorId: after?.authorId, postId });
  if (after && !before && after.authorId && postId) {
    console.log('✅ Sending comment notification');
    try {
      // Get post author to notify
      const postSnap = await db.collection('posts').doc(postId).get();
      if (!postSnap.exists) {
        console.log('❌ Post not found:', postId);
        return null;
      }
      const postAuthorId = postSnap.get('authorId');
      console.log('👤 Post author:', postAuthorId, '| Commenter:', after.authorId);

      // Don't notify if user comments on their own post
      if (postAuthorId === after.authorId) {
        console.log('⚠️ User commented on their own post, no notification');
        return null;
      }

      // Get commenter info
      const userSnap = await db.collection('users').doc(after.authorId).get();
      if (!userSnap.exists) return null;
      const userData = userSnap.data();
      const commenterName = userData.displayName || userData.email || 'Un utilisateur';
      const commenterPhotoUrl = userData.photoURL || null;

      // Create notification document
      const now = admin.firestore.FieldValue.serverTimestamp();
      const notifRef = db.collection('notifications').doc();
      const commentPreview = (after.content || '').slice(0, 100);

      await notifRef.set({
        id: notifRef.id,
        type: 'postCommented',
        recipientId: postAuthorId,
        title: 'Nouveau commentaire',
        message: `${commenterName} a commenté votre publication`,
        data: {
          commenterId: after.authorId,
          postId: postId,
          commentId: event.params.commentId,
          commentContent: commentPreview,
        },
        createdAt: now,
        isRead: false,
        readAt: null,
        senderId: after.authorId,
        senderName: commenterName,
        senderPhotoUrl: commenterPhotoUrl,
        postId: postId,
        commentId: event.params.commentId,
      });

      // Send FCM push notification
      const authorSnap = await db.collection('users').doc(postAuthorId).get();
      if (authorSnap.exists) {
        const deviceToken = authorSnap.get('deviceToken');
        if (deviceToken && typeof deviceToken === 'string') {
          try {
            await admin.messaging().send({
              token: deviceToken,
              notification: {
                title: 'Nouveau commentaire',
                body: `${commenterName}: ${commentPreview}`,
              },
              data: {
                type: 'postCommented',
                postId: postId,
                commentId: event.params.commentId,
                commenterId: after.authorId,
              },
            });
          } catch (fcmError) {
            console.error('Erreur FCM:', fcmError);
          }
        }
      }
    } catch (notifError) {
      console.error('Erreur création notification commentaire:', notifError);
    }
  }

  return null;
});

exports.onPostDelete = onDocumentDeleted('posts/{postId}', async (event) => {
  const postId = event.params.postId;
  const batch = db.batch();

  const commentsSnap = await db.collection('comments').where('postId', '==', postId).get();
  commentsSnap.forEach((doc) => batch.delete(doc.ref));

  const reactionsSnap = await db
    .collection('reactions')
    .where('targetType', '==', 'post')
    .where('targetId', '==', postId)
    .get();
  reactionsSnap.forEach((doc) => batch.delete(doc.ref));

  await batch.commit();
  return null;
});

// =============================
// Follow System - Triggers
// =============================
exports.onFollowWrite = onDocumentWritten('follows/{followId}', async (event) => {
  const after = event.data.after ? event.data.after.data() : null;
  const before = event.data.before ? event.data.before.data() : null;

  // Send notification for new follows only
  if (after && !before && after.followerId && after.followingId) {
    try {
      const followerId = after.followerId;
      const followingId = after.followingId;

      // Get follower info
      const followerSnap = await db.collection('users').doc(followerId).get();
      if (!followerSnap.exists) return null;
      const followerData = followerSnap.data();
      const followerName = followerData.displayName || followerData.email || 'Un utilisateur';
      const followerPhotoUrl = followerData.photoURL || null;

      // Create notification document
      const now = admin.firestore.FieldValue.serverTimestamp();
      const notifRef = db.collection('notifications').doc();

      await notifRef.set({
        id: notifRef.id,
        type: 'newFollower',
        recipientId: followingId,
        title: 'Nouveau follower',
        message: `${followerName} a commencé à vous suivre`,
        data: {
          followerId: followerId,
        },
        createdAt: now,
        isRead: false,
        readAt: null,
        senderId: followerId,
        senderName: followerName,
        senderPhotoUrl: followerPhotoUrl,
      });

      // Send FCM push notification
      const followingSnap = await db.collection('users').doc(followingId).get();
      if (followingSnap.exists) {
        const deviceToken = followingSnap.get('deviceToken');
        if (deviceToken && typeof deviceToken === 'string') {
          try {
            await admin.messaging().send({
              token: deviceToken,
              notification: {
                title: 'Nouveau follower',
                body: `${followerName} a commencé à vous suivre`,
              },
              data: {
                type: 'newFollower',
                followerId: followerId,
              },
            });
          } catch (fcmError) {
            console.error('Erreur FCM:', fcmError);
          }
        }
      }
    } catch (notifError) {
      console.error('Erreur création notification follow:', notifError);
    }
  }

  return null;
});
