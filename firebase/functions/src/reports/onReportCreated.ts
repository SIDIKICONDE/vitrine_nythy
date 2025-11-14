import * as admin from 'firebase-admin';
import {onDocumentCreated} from 'firebase-functions/v2/firestore';

const db = admin.firestore();

/**
 * Cloud Function : Notifie les administrateurs quand un signalement est créé
 * 
 * Déclencheur : Création d'un document dans /reports/{reportId}
 * 
 * Actions :
 * 1. Récupère tous les administrateurs
 * 2. Envoie une notification push à chaque admin
 * 3. Crée un document de notification dans Firestore
 * 
 * ⚠️ IMPORTANT: Le propriétaire du post et l'utilisateur qui signale 
 * ne reçoivent AUCUNE notification (confidentialité du signalement)
 */
export const onReportCreated = onDocumentCreated(
  'reports/{reportId}',
  async (event) => {
    try {
      const reportDoc = event.data;
      if (!reportDoc) {
        console.log('⚠️ No report data');
        return null;
      }

      const reportData = reportDoc.data();
      const reportId = reportDoc.id;

      console.log(`🚩 New report created: ${reportId}`);
      console.log(`   Type: ${reportData.targetType}`);
      console.log(`   Reason: ${reportData.reason}`);
      console.log(`   Reporter: ${reportData.reporterId}`);

      // ═══════════════════════════════════════════════════════════
      // 1. RÉCUPÉRER TOUS LES ADMINISTRATEURS
      // ═══════════════════════════════════════════════════════════

      // Méthode 1: Collection admins
      const adminsSnapshot = await db.collection('admins').get();
      const adminIds = new Set<string>();

      adminsSnapshot.docs.forEach((doc) => {
        adminIds.add(doc.id);
      });

      // Méthode 2: Utilisateurs avec role='admin'
      const usersSnapshot = await db.collection('users')
        .where('role', '==', 'admin')
        .get();

      usersSnapshot.docs.forEach((doc) => {
        adminIds.add(doc.id);
      });

      console.log(`👥 Found ${adminIds.size} administrators`);

      if (adminIds.size === 0) {
        console.log('⚠️ No administrators found');
        return null;
      }

      // ═══════════════════════════════════════════════════════════
      // 2. RÉCUPÉRER LES TOKENS FCM DES ADMINS
      // ═══════════════════════════════════════════════════════════

      const tokens: string[] = [];
      const adminData = new Map<string, any>();

      for (const adminId of Array.from(adminIds)) {
        try {
          const userDoc = await db.collection('users').doc(adminId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            const token = userData?.deviceToken;
            
            if (token && typeof token === 'string') {
              tokens.push(token);
              adminData.set(adminId, userData);
            }
          }
        } catch (error) {
          console.error(`Error fetching admin ${adminId}:`, error);
        }
      }

      console.log(`🔑 Found ${tokens.length} valid FCM tokens`);

      // ═══════════════════════════════════════════════════════════
      // 3. PRÉPARER LE CONTENU DE LA NOTIFICATION
      // ═══════════════════════════════════════════════════════════

      const targetTypeEmoji = getTargetTypeEmoji(reportData.targetType);
      const reasonLabel = getReasonLabel(reportData.reason);

      const notificationTitle = '🚩 Nouveau signalement';
      const notificationBody = 
        `${targetTypeEmoji} ${reportData.targetType} signalé pour ${reasonLabel}`;

      // ═══════════════════════════════════════════════════════════
      // 4. CRÉER LES DOCUMENTS DE NOTIFICATION DANS FIRESTORE
      // ═══════════════════════════════════════════════════════════

      const now = admin.firestore.FieldValue.serverTimestamp();
      const notificationPromises: Promise<any>[] = [];

      for (const adminId of Array.from(adminIds)) {
        const notifRef = db.collection('notifications').doc();
        
        const notificationDoc = {
          id: notifRef.id,
          type: 'report',
          recipientId: adminId,
          title: notificationTitle,
          message: notificationBody,
          data: {
            reportId: reportId,
            targetId: reportData.targetId,
            targetType: reportData.targetType,
            reason: reportData.reason,
            reporterId: reportData.reporterId,
          },
          createdAt: now,
          isRead: false,
          readAt: null,
          senderId: null, // Système
          postId: reportData.targetType === 'post' ? reportData.targetId : null,
          commentId: reportData.targetType === 'comment' ? reportData.targetId : null,
          storeId: reportData.targetType === 'store' ? reportData.targetId : null,
        };

        notificationPromises.push(notifRef.set(notificationDoc));
      }

      await Promise.all(notificationPromises);
      console.log(`✅ Created ${notificationPromises.length} notification documents`);

      // ═══════════════════════════════════════════════════════════
      // 5. ENVOYER LES NOTIFICATIONS PUSH FCM
      // ═══════════════════════════════════════════════════════════

      if (tokens.length > 0) {
        const fcmMessage = {
          notification: {
            title: notificationTitle,
            body: notificationBody,
          },
          data: {
            type: 'report',
            reportId: reportId,
            targetId: reportData.targetId,
            targetType: reportData.targetType,
            reason: reportData.reason,
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            route: '/admin/reports',
          },
          tokens: tokens,
        };

        try {
          const response = await admin.messaging().sendEachForMulticast(fcmMessage);
          console.log(`📱 FCM sent: ${response.successCount} success, ${response.failureCount} failures`);

          // Log les erreurs individuelles
          if (response.failureCount > 0) {
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                console.error(`Failed to send to token ${idx}:`, resp.error);
              }
            });
          }
        } catch (fcmError) {
          console.error('❌ Error sending FCM notifications:', fcmError);
        }
      } else {
        console.log('⚠️ No FCM tokens available for push notifications');
      }

      // ═══════════════════════════════════════════════════════════
      // 6. INCRÉMENTER LE COMPTEUR DE SIGNALEMENTS POUR LES STATS
      // ═══════════════════════════════════════════════════════════

      try {
        const statsRef = db.collection('admin_stats').doc('reports');
        await statsRef.set({
          totalReports: admin.firestore.FieldValue.increment(1),
          pendingReports: admin.firestore.FieldValue.increment(1),
          lastReportAt: now,
          updatedAt: now,
        }, { merge: true });

        console.log('📊 Updated report statistics');
      } catch (statsError) {
        console.error('Error updating stats:', statsError);
        // Ne pas échouer si les stats ne peuvent pas être mises à jour
      }

      console.log('✅ Report notification process completed');
      return { success: true, adminCount: adminIds.size, tokenCount: tokens.length };

    } catch (error) {
      console.error('❌ Error in onReportCreated:', error);
      throw error;
    }
  }
);

/**
 * Retourne l'emoji correspondant au type de cible
 */
function getTargetTypeEmoji(targetType: string): string {
  const emojis: Record<string, string> = {
    'post': '📝',
    'comment': '💬',
    'user': '👤',
    'store': '🏪',
  };
  return emojis[targetType] || '📄';
}

/**
 * Retourne le label en français de la raison
 */
function getReasonLabel(reason: string): string {
  const labels: Record<string, string> = {
    'spam': 'spam',
    'inappropriate-content': 'contenu inapproprié',
    'harassment': 'harcèlement',
    'fake-information': 'fausses informations',
    'violence': 'violence',
    'hate-speech': 'discours haineux',
    'copyright': 'violation de droits d\'auteur',
    'other': 'autre motif',
  };
  return labels[reason] || reason;
}

