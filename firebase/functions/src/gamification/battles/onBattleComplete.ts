import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

/**
 * Cloud Function Trigger - onBattleComplete
 * 
 * S'exécute automatiquement quand une battle passe à 'finished'
 * 
 * Responsabilités :
 * - Vérification anti-cheat des scores
 * - Recalcul du gagnant côté serveur
 * - Distribution des points avec multiplicateurs
 * - Mise à jour des stats atomiquement
 * - Création des notifications
 * - Logging pour analytics
 */
export const onBattleComplete = onDocumentUpdated(
  {
    document: "battles/{battleId}",
    region: "europe-west1",
  },
  async (event) => {
    const battleId = event.params.battleId;

    // Récupérer les données avant et après
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) {
      logger.warn(`onBattleComplete: Missing data for battle ${battleId}`);
      return;
    }

    // Détecter changement status → 'finished'
    if (before.status !== "finished" && after.status === "finished") {
      logger.info(`Processing completed battle: ${battleId}`);

      const db = admin.firestore();
      const battleRef = event.data?.after.ref;

      if (!battleRef) {
        logger.error("Battle reference is undefined");
        return;
      }

      try {
        // === ÉTAPE 1 : VÉRIFICATIONS ANTI-CHEAT ===

        // 1.1 Vérifier que les scores sont raisonnables
        const MAX_SCORE = 10000;
        if (after.player1Score > MAX_SCORE || after.player2Score > MAX_SCORE) {
          logger.warn(
            `Suspicious scores detected in battle ${battleId}: ` +
            `P1=${after.player1Score}, P2=${after.player2Score}`
          );

          // Marquer la battle comme suspecte et annuler
          await battleRef.update({
            status: "cancelled",
            cancelReason: "suspicious_score",
            cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // Logger pour investigation
          await db.collection("security_logs").add({
            type: "suspicious_battle",
            battleId,
            player1Id: after.player1Id,
            player2Id: after.player2Id,
            player1Score: after.player1Score,
            player2Score: after.player2Score,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

          return;
        }

        // 1.2 Vérifier timing (battle terminée trop rapidement = suspect)
        const createdAt = after.createdAt?.toDate();
        const finishedAt = new Date();
        const durationMinutes = createdAt
          ? (finishedAt.getTime() - createdAt.getTime()) / (1000 * 60)
          : 0;

        const MIN_DURATION_MINUTES = 1; // Au moins 1 minute
        if (durationMinutes < MIN_DURATION_MINUTES) {
          logger.warn(
            `Battle ${battleId} completed too quickly: ${durationMinutes} minutes`
          );
          // On log mais on ne bloque pas (peut être légitime)
        }

        // === ÉTAPE 2 : RECALCULER LE GAGNANT ===

        // Ne jamais faire confiance au winnerId du client, toujours recalculer
        const recalculatedWinnerId =
          after.player1Score > after.player2Score
            ? after.player1Id
            : after.player2Score > after.player1Score
              ? after.player2Id
              : null; // Égalité

        // Si le winnerId client est différent du recalculé, corriger
        if (after.winnerId !== recalculatedWinnerId) {
          logger.warn(
            `Winner mismatch in battle ${battleId}! ` +
            `Client: ${after.winnerId}, Server: ${recalculatedWinnerId}`
          );

          await battleRef.update({
            winnerId: recalculatedWinnerId,
            winnerRecalculated: true,
          });
        }

        const winnerId = recalculatedWinnerId;
        const loserId =
          winnerId === after.player1Id
            ? after.player2Id
            : winnerId === after.player2Id
              ? after.player1Id
              : null;

        // === ÉTAPE 3 : CALCULER LES POINTS ===

        const basePoints = 500; // Points de base
        const typeMultiplier = getTypeMultiplier(after.type);
        const scoreDifference = Math.abs(
          after.player1Score - after.player2Score
        );

        // Bonus selon l'écart de score (10 pts par point d'écart)
        const scoreBonus = Math.min(scoreDifference * 10, 1000);

        // Points du gagnant
        const winnerPoints = Math.floor(
          (basePoints + scoreBonus) * typeMultiplier
        );

        // Points de consolation pour le perdant (10% des points du gagnant, minimum 50)
        const loserPoints = Math.max(50, Math.floor(winnerPoints * 0.1));

        // Garantir que les points sont toujours positifs
        const player1Points = Math.max(0,
          winnerId === after.player1Id ? winnerPoints : loserPoints
        );
        const player2Points = Math.max(0,
          winnerId === after.player2Id ? winnerPoints : loserPoints
        );

        logger.info(
          `Battle ${battleId} points: P1=${player1Points}, P2=${player2Points}`
        );

        // === ÉTAPE 4 : MISE À JOUR ATOMIQUE AVEC BATCH ===

        const batch = db.batch();

        // 4.1 Mettre à jour player1 stats
        const player1StatsRef = db
          .collection("player_stats")
          .doc(after.player1Id);

        const player1Updates: any = {
          battlesPlayed: admin.firestore.FieldValue.increment(1),
          totalPoints: admin.firestore.FieldValue.increment(player1Points),
          lastBattleAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (winnerId === after.player1Id) {
          // Victoire
          player1Updates.battlesWon =
            admin.firestore.FieldValue.increment(1);
          player1Updates.currentStreak =
            admin.firestore.FieldValue.increment(1);
        } else if (loserId === after.player1Id) {
          // Défaite
          player1Updates.battlesLost =
            admin.firestore.FieldValue.increment(1);
          player1Updates.currentStreak = 0; // Reset streak
        }

        batch.set(player1StatsRef, player1Updates, { merge: true });

        // 4.2 Mettre à jour player2 stats
        const player2StatsRef = db
          .collection("player_stats")
          .doc(after.player2Id);

        const player2Updates: any = {
          battlesPlayed: admin.firestore.FieldValue.increment(1),
          totalPoints: admin.firestore.FieldValue.increment(player2Points),
          lastBattleAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        if (winnerId === after.player2Id) {
          // Victoire
          player2Updates.battlesWon =
            admin.firestore.FieldValue.increment(1);
          player2Updates.currentStreak =
            admin.firestore.FieldValue.increment(1);
        } else if (loserId === after.player2Id) {
          // Défaite
          player2Updates.battlesLost =
            admin.firestore.FieldValue.increment(1);
          player2Updates.currentStreak = 0; // Reset streak
        }

        batch.set(player2StatsRef, player2Updates, { merge: true });

        // 4.3 Créer notification pour player1
        const notif1Ref = db.collection("notifications").doc();
        batch.set(notif1Ref, {
          recipientId: after.player1Id,
          type: winnerId === after.player1Id ? "battle_won" : "battle_lost",
          title:
            winnerId === after.player1Id
              ? "Victoire ! 🎉"
              : "Défaite...",
          message:
            winnerId === after.player1Id
              ? `Tu as gagné ${player1Points} points !`
              : `Tu as gagné ${player1Points} points de consolation`,
          battleId,
          points: player1Points,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isRead: false,
        });

        // 4.4 Créer notification pour player2
        const notif2Ref = db.collection("notifications").doc();
        batch.set(notif2Ref, {
          recipientId: after.player2Id,
          type: winnerId === after.player2Id ? "battle_won" : "battle_lost",
          title:
            winnerId === after.player2Id
              ? "Victoire ! 🎉"
              : "Défaite...",
          message:
            winnerId === after.player2Id
              ? `Tu as gagné ${player2Points} points !`
              : `Tu as gagné ${player2Points} points de consolation`,
          battleId,
          points: player2Points,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          isRead: false,
        });

        // 4.5 Logger pour analytics
        const analyticsRef = db.collection("analytics_events").doc();
        batch.set(analyticsRef, {
          event: "battle_completed",
          battleId,
          type: after.type,
          winnerId,
          loserId,
          player1Id: after.player1Id,
          player2Id: after.player2Id,
          player1Score: after.player1Score,
          player2Score: after.player2Score,
          player1Points,
          player2Points,
          durationMinutes: Math.round(durationMinutes),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 4.6 Commit atomique
        await batch.commit();

        logger.info(
          `Battle ${battleId} processed successfully. Winner: ${winnerId || "draw"}`
        );
      } catch (error) {
        logger.error(`Error processing battle ${battleId}:`, error);

        // Logger l'erreur
        await db.collection("error_logs").add({
          type: "onBattleComplete_error",
          battleId,
          error: error instanceof Error ? error.message : String(error),
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }
);

/**
 * Retourne le multiplicateur de points selon le type de battle
 */
function getTypeMultiplier(type: string): number {
  switch (type) {
    case "random":
      return 1.0;
    case "friend":
      return 1.0;
    case "revenge":
      return 2.0; // x2 pour revenge
    case "championship":
      return 5.0; // x5 pour championship
    default:
      return 1.0;
  }
}

