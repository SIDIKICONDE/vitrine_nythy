import * as admin from 'firebase-admin';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

/**
 * Synchronise le messageCount des conversations avec le nombre réel de messages
 * Fonction callable pour corriger les conversations existantes
 */
export const syncMessageCount = onCall(
  {
    region: 'europe-west1',
  },
  async (request) => {
    // Vérifier l'authentification
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Utilisateur non authentifié');
    }

    // Optionnel : vérifier que c'est un admin (décommenter si nécessaire)
    // const userDoc = await admin.firestore().collection('users').doc(request.auth.uid).get();
    // if (userDoc.data()?.role !== 'admin') {
    //   throw new HttpsError('permission-denied', 'Accès réservé aux administrateurs');
    // }

    const { conversationId } = request.data || {};

    try {
      const db = admin.firestore();
      let updatedCount = 0;
      let processedCount = 0;

      if (conversationId) {
        // Synchroniser une conversation spécifique
        console.log(`🔄 Synchronisation messageCount pour la conversation: ${conversationId}`);
        const result = await syncSingleConversation(db, conversationId);
        if (result) {
          updatedCount = 1;
          processedCount = 1;
        }
      } else {
        // Synchroniser toutes les conversations
        console.log('🔄 Synchronisation messageCount pour toutes les conversations');
        const conversationsSnapshot = await db
          .collection('conversations')
          .limit(100) // Limiter à 100 par batch pour éviter les timeouts
          .get();

        const batch = db.batch();
        let batchSize = 0;
        const maxBatchSize = 500; // Limite Firestore

        for (const convDoc of conversationsSnapshot.docs) {
          const convId = convDoc.id;
          const messagesSnapshot = await db
            .collection('conversations')
            .doc(convId)
            .collection('messages')
            .count()
            .get();

          const realMessageCount = messagesSnapshot.data()?.count || 0;
          const currentMessageCount = convDoc.data()?.messageCount || 0;

          if (realMessageCount !== currentMessageCount) {
            console.log(
              `  Conversation ${convId}: ${currentMessageCount} → ${realMessageCount} messages`,
            );
            batch.update(convDoc.ref, {
              messageCount: realMessageCount,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            updatedCount++;
            batchSize++;

            if (batchSize >= maxBatchSize) {
              await batch.commit();
              console.log(`  ✅ Batch de ${batchSize} conversations mises à jour`);
              batchSize = 0;
            }
          }
          processedCount++;
        }

        if (batchSize > 0) {
          await batch.commit();
          console.log(`  ✅ Dernier batch de ${batchSize} conversations mises à jour`);
        }
      }

      return {
        success: true,
        updatedCount,
        processedCount,
        message: `Synchronisation terminée: ${updatedCount} conversation(s) mise(s) à jour sur ${processedCount} traitée(s)`,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      throw new HttpsError(
        'internal',
        `Erreur lors de la synchronisation: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
);

/**
 * Synchronise le messageCount d'une conversation spécifique
 */
async function syncSingleConversation(
  db: admin.firestore.Firestore,
  conversationId: string,
): Promise<boolean> {
  const convRef = db.collection('conversations').doc(conversationId);
  const convDoc = await convRef.get();

  if (!convDoc.exists) {
    console.log(`  ⚠️ Conversation ${conversationId} introuvable`);
    return false;
  }

  // Compter les messages réels
  const messagesSnapshot = await convRef.collection('messages').count().get();
  const realMessageCount = messagesSnapshot.data()?.count || 0;
  const currentMessageCount = convDoc.data()?.messageCount || 0;

  if (realMessageCount !== currentMessageCount) {
    console.log(
      `  Conversation ${conversationId}: ${currentMessageCount} → ${realMessageCount} messages`,
    );
    await convRef.update({
      messageCount: realMessageCount,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return true;
  }

  console.log(`  Conversation ${conversationId}: déjà synchronisée (${realMessageCount} messages)`);
  return false;
}

