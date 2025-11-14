import * as admin from 'firebase-admin';
import { onDocumentCreated, onDocumentDeleted, onDocumentUpdated } from 'firebase-functions/v2/firestore';

/**
 * Cloud Function : Met à jour automatiquement les compteurs de messages non lus
 * ⚡ OPTIMISATION MAJEURE : Maintient un document global au lieu de parcourir toutes les conversations
 * 
 * Déclencheur : Quand un nouveau message est créé
 * 
 * Action :
 * 1. Incrémente unreadCount dans la conversation pour tous les participants sauf l'expéditeur
 * 2. Met à jour le document users/{userId}/stats/unreadSummary pour chaque participant
 */

export const onMessageCreated = onDocumentCreated(
  'conversations/{conversationId}/messages/{messageId}',
  async (event) => {
    const conversationId = event.params.conversationId;
    const messageData = event.data?.data();

    if (!messageData) {
      console.warn('Message data is empty');
      return;
    }

    const senderId = messageData.senderId;

    try {
      // Récupérer la conversation pour avoir la liste des participants
      const conversationRef = admin.firestore()
        .collection('conversations')
        .doc(conversationId);

      const conversationSnap = await conversationRef.get();

      if (!conversationSnap.exists) {
        console.warn(`Conversation ${conversationId} not found`);
        return;
      }

      const conversationData = conversationSnap.data();
      const participantIds: string[] = conversationData?.participantIds || [];

      // Filtrer pour exclure l'expéditeur
      const recipientIds = participantIds.filter(id => id !== senderId);

      if (recipientIds.length === 0) {
        console.log('No recipients to update');
        return;
      }

      // Batch pour toutes les mises à jour
      const batch = admin.firestore().batch();

      // 1. Mettre à jour unreadCount dans la conversation pour chaque destinataire
      const unreadUpdates: { [key: string]: admin.firestore.FieldValue } = {};
      for (const recipientId of recipientIds) {
        unreadUpdates[`unreadCount.${recipientId}`] = admin.firestore.FieldValue.increment(1);
      }

      batch.update(conversationRef, unreadUpdates);

      // 2. Mettre à jour le document unreadSummary pour chaque destinataire
      for (const recipientId of recipientIds) {
        const summaryRef = admin.firestore()
          .collection('users')
          .doc(recipientId)
          .collection('stats')
          .doc('unreadSummary');

        batch.set(summaryRef, {
          totalUnread: admin.firestore.FieldValue.increment(1),
          [`conversations.${conversationId}`]: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      // 3. Mettre à jour lastMessageText, lastMessageTimestamp et messageCount dans la conversation
      batch.update(conversationRef, {
        lastMessageText: messageData.content || '',
        lastMessageTimestamp: messageData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        messageCount: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Commit toutes les mises à jour
      await batch.commit();

      console.log(`✅ Unread counters updated for ${recipientIds.length} recipients`);

      // 4. Envoyer les notifications FCM aux destinataires
      try {
        const senderDoc = await admin.firestore().collection('users').doc(senderId).get();
        const senderData = senderDoc.data();
        const senderName = senderData?.displayName || senderData?.email || 'Un utilisateur';
        const messageContent = messageData.content || '';
        const messagePreview = messageContent.length > 100
          ? messageContent.substring(0, 100) + '...'
          : messageContent;

        // Préparer les données de notification
        const isGroup = participantIds.length > 2;
        const conversationName = conversationData?.name;

        const notificationTitle = isGroup && conversationName
          ? conversationName
          : senderName;

        const notificationBody = isGroup && conversationName
          ? `${senderName}: ${messagePreview}`
          : messagePreview;

        // Récupérer les tokens FCM des destinataires
        const tokens: string[] = [];
        for (const recipientId of recipientIds) {
          const userDoc = await admin.firestore().collection('users').doc(recipientId).get();
          const deviceToken = userDoc.exists ? userDoc.get('deviceToken') : null;
          if (deviceToken && typeof deviceToken === 'string') {
            tokens.push(deviceToken);
          }
        }

        if (tokens.length > 0) {
          const fcmMessage = {
            notification: {
              title: notificationTitle,
              body: notificationBody,
            },
            data: {
              type: isGroup ? 'group_message' : 'message',
              conversationId: conversationId,
              senderId: senderId,
              senderName: senderName,
              messageId: event.params.messageId,
            },
            tokens: tokens,
          };

          const response = await admin.messaging().sendEachForMulticast(fcmMessage);
          console.log(`📱 FCM sent: ${response.successCount} success, ${response.failureCount} failures`);
        } else {
          console.log('⚠️ No FCM tokens found for recipients');
        }
      } catch (notifError) {
        console.error('❌ Error sending FCM notifications:', notifError);
        // Ne pas échouer si l'envoi de notification échoue
      }

    } catch (error) {
      console.error('Error updating unread counters:', error);
      throw error;
    }
  });

/**
 * Cloud Function : Met à jour le compteur quand une conversation est marquée comme lue
 * 
 * Déclencheur : Quand lastReadTimestamp est mis à jour
 */
export const onConversationRead = onDocumentUpdated(
  'conversations/{conversationId}',
  async (event) => {
    const conversationId = event.params.conversationId;
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    if (!beforeData || !afterData) {
      return;
    }

    // Vérifier si unreadCount a changé
    const beforeUnreadCount = beforeData.unreadCount || {};
    const afterUnreadCount = afterData.unreadCount || {};

    // Détecter les utilisateurs dont le compteur a été réinitialisé
    const updatedUsers: { userId: string; countBefore: number }[] = [];

    for (const userId in afterUnreadCount) {
      const before = beforeUnreadCount[userId] || 0;
      const after = afterUnreadCount[userId] || 0;

      // Si le compteur a diminué, mettre à jour le summary
      if (after < before) {
        updatedUsers.push({ userId, countBefore: before });
      }
    }

    if (updatedUsers.length === 0) {
      return;
    }

    try {
      const batch = admin.firestore().batch();

      for (const { userId, countBefore } of updatedUsers) {
        const summaryRef = admin.firestore()
          .collection('users')
          .doc(userId)
          .collection('stats')
          .doc('unreadSummary');

        const after = afterUnreadCount[userId] || 0;
        const difference = countBefore - after;

        batch.set(summaryRef, {
          totalUnread: admin.firestore.FieldValue.increment(-difference),
          [`conversations.${conversationId}`]: after,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }

      await batch.commit();

      console.log(`✅ Unread summary updated for ${updatedUsers.length} users`);

    } catch (error) {
      console.error('Error updating unread summary:', error);
      throw error;
    }
  });

/**
 * Cloud Function : Nettoie le compteur quand une conversation est supprimée
 */
export const onConversationDeleted = onDocumentDeleted(
  'conversations/{conversationId}',
  async (event) => {
    const conversationId = event.params.conversationId;
    const conversationData = event.data?.data();

    if (!conversationData) {
      return;
    }

    const participantIds: string[] = conversationData.participantIds || [];
    const unreadCount = conversationData.unreadCount || {};

    try {
      const batch = admin.firestore().batch();

      for (const userId of participantIds) {
        const userUnread = unreadCount[userId] || 0;

        if (userUnread > 0) {
          const summaryRef = admin.firestore()
            .collection('users')
            .doc(userId)
            .collection('stats')
            .doc('unreadSummary');

          batch.update(summaryRef, {
            totalUnread: admin.firestore.FieldValue.increment(-userUnread),
            [`conversations.${conversationId}`]: admin.firestore.FieldValue.delete(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      await batch.commit();

      console.log(`✅ Unread summary cleaned for ${participantIds.length} participants`);

    } catch (error) {
      console.error('Error cleaning unread summary:', error);
      throw error;
    }
  });

