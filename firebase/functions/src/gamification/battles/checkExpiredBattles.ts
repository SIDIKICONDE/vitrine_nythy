import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";

/**
 * Cloud Function Scheduled - checkExpiredBattles
 * 
 * S'exécute automatiquement toutes les 5 minutes
 * 
 * Responsabilités :
 * - Trouver les battles expirées (endTime < now && status == 'active')
 * - Calculer le gagnant selon les scores actuels
 * - Marquer comme 'expired'
 * - Distribuer points réduits (pénalité -30%)
 * - Mettre à jour les stats atomiquement
 * - Créer notifications
 * - Logger pour analytics
 */
export const checkExpiredBattles = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "Europe/Paris",
    region: "europe-west1",
  },
  async (event) => {
    logger.info("Starting checkExpiredBattles cron job");

    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    try {
      // === ÉTAPE 1 : QUERY BATTLES EXPIRÉES ===

      const expiredBattlesSnapshot = await db
        .collection("battles")
        .where("status", "==", "active")
        .where("endTime", "<", now)
        .get();

      const expiredCount = expiredBattlesSnapshot.size;
      logger.info(`Found ${expiredCount} expired battle(s)`);

      if (expiredCount === 0) {
        return; // Rien à faire
      }

      // === ÉTAPE 2 : TRAITER CHAQUE BATTLE EXPIRÉE ===

      // Limiter à 20 battles par exécution pour éviter timeout
      const battlesToProcess = expiredBattlesSnapshot.docs.slice(0, 20);

      for (const battleDoc of battlesToProcess) {
        const battleId = battleDoc.id;
        const battle = battleDoc.data();

        logger.info(
          `Processing expired battle ${battleId}: ` +
          `P1=${battle.player1Score}, P2=${battle.player2Score}`
        );

        try {
          // Utiliser WriteBatch pour atomicité
          const batch = db.batch();

          // === ÉTAPE 3 : CALCULER LE GAGNANT ===

          const winnerId =
            battle.player1Score > battle.player2Score
              ? battle.player1Id
              : battle.player2Score > battle.player1Score
                ? battle.player2Id
                : null; // Égalité

          const loserId =
            winnerId === battle.player1Id
              ? battle.player2Id
              : winnerId === battle.player2Id
                ? battle.player1Id
                : null;

          logger.info(
            `Battle ${battleId} expired. Winner: ${winnerId || "draw"}`
          );

          // === ÉTAPE 4 : MARQUER COMME EXPIRÉE ===

          batch.update(battleDoc.ref, {
            status: "expired",
            winnerId,
            finishedAt: admin.firestore.FieldValue.serverTimestamp(),
            expiredAutomatically: true,
          });

          // === ÉTAPE 5 : CALCULER POINTS AVEC PÉNALITÉ ===

          const basePoints = 500;
          const typeMultiplier = getTypeMultiplier(battle.type);
          const expirationPenalty = 0.7; // -30% de pénalité
          const scoreDifference = Math.abs(
            battle.player1Score - battle.player2Score
          );
          const scoreBonus = Math.min(scoreDifference * 10, 1000);

          // Points réduits à cause de l'expiration
          const winnerPoints = Math.max(0, Math.floor(
            (basePoints + scoreBonus) * typeMultiplier * expirationPenalty
          ));
          // Points de consolation pour le perdant (10% des points du gagnant, minimum 50)
          const loserPoints = Math.max(50, Math.floor(winnerPoints * 0.1));

          // Garantir que les points sont toujours positifs
          const player1Points = Math.max(0,
            winnerId === battle.player1Id ? winnerPoints : loserPoints
          );
          const player2Points = Math.max(0,
            winnerId === battle.player2Id ? winnerPoints : loserPoints
          );

          logger.info(
            `Expired battle ${battleId} points (with penalty): ` +
            `P1=${player1Points}, P2=${player2Points}`
          );

          // === ÉTAPE 6 : METTRE À JOUR STATS ===

          // 6.1 Player 1 stats
          const player1StatsRef = db
            .collection("player_stats")
            .doc(battle.player1Id);

          const player1Updates: any = {
            battlesPlayed: admin.firestore.FieldValue.increment(1),
            totalPoints: admin.firestore.FieldValue.increment(player1Points),
            lastBattleAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (winnerId === battle.player1Id) {
            player1Updates.battlesWon =
              admin.firestore.FieldValue.increment(1);
            player1Updates.currentStreak =
              admin.firestore.FieldValue.increment(1);
          } else if (loserId === battle.player1Id) {
            player1Updates.battlesLost =
              admin.firestore.FieldValue.increment(1);
            player1Updates.currentStreak = 0;
          }

          batch.set(player1StatsRef, player1Updates, { merge: true });

          // 6.2 Player 2 stats
          const player2StatsRef = db
            .collection("player_stats")
            .doc(battle.player2Id);

          const player2Updates: any = {
            battlesPlayed: admin.firestore.FieldValue.increment(1),
            totalPoints: admin.firestore.FieldValue.increment(player2Points),
            lastBattleAt: admin.firestore.FieldValue.serverTimestamp(),
          };

          if (winnerId === battle.player2Id) {
            player2Updates.battlesWon =
              admin.firestore.FieldValue.increment(1);
            player2Updates.currentStreak =
              admin.firestore.FieldValue.increment(1);
          } else if (loserId === battle.player2Id) {
            player2Updates.battlesLost =
              admin.firestore.FieldValue.increment(1);
            player2Updates.currentStreak = 0;
          }

          batch.set(player2StatsRef, player2Updates, { merge: true });

          // === ÉTAPE 7 : CRÉER NOTIFICATIONS ===

          // 7.1 Notification player1
          const notif1Ref = db.collection("notifications").doc();
          batch.set(notif1Ref, {
            recipientId: battle.player1Id,
            type:
              winnerId === battle.player1Id
                ? "battle_expired_won"
                : "battle_expired_lost",
            title:
              winnerId === battle.player1Id
                ? "Battle expirée - Victoire"
                : "Battle expirée - Défaite",
            message:
              winnerId === battle.player1Id
                ? `Battle expirée ! Tu gagnes ${player1Points} points (pénalité -30%)`
                : `Battle expirée. ${player1Points} points de consolation`,
            battleId,
            points: player1Points,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
          });

          // 7.2 Notification player2
          const notif2Ref = db.collection("notifications").doc();
          batch.set(notif2Ref, {
            recipientId: battle.player2Id,
            type:
              winnerId === battle.player2Id
                ? "battle_expired_won"
                : "battle_expired_lost",
            title:
              winnerId === battle.player2Id
                ? "Battle expirée - Victoire"
                : "Battle expirée - Défaite",
            message:
              winnerId === battle.player2Id
                ? `Battle expirée ! Tu gagnes ${player2Points} points (pénalité -30%)`
                : `Battle expirée. ${player2Points} points de consolation`,
            battleId,
            points: player2Points,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            isRead: false,
          });

          // === ÉTAPE 8 : LOGGER ANALYTICS ===

          const analyticsRef = db.collection("analytics_events").doc();
          batch.set(analyticsRef, {
            event: "battle_expired",
            battleId,
            type: battle.type,
            winnerId,
            loserId,
            player1Id: battle.player1Id,
            player2Id: battle.player2Id,
            player1Score: battle.player1Score,
            player2Score: battle.player2Score,
            player1Points,
            player2Points,
            penaltyApplied: expirationPenalty,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });

          // === ÉTAPE 9 : COMMIT ATOMIQUE ===

          await batch.commit();

          logger.info(`Successfully processed expired battle ${battleId}`);
        } catch (error) {
          logger.error(`Error processing expired battle ${battleId}:`, error);

          // Logger l'erreur mais continuer avec les autres battles
          await db.collection("error_logs").add({
            type: "checkExpiredBattles_error",
            battleId,
            error: error instanceof Error ? error.message : String(error),
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
          });
        }
      }

      logger.info(
        `checkExpiredBattles completed. Processed ${battlesToProcess.length} battle(s)`
      );

      // Si on a atteint la limite de 20, il peut y en avoir d'autres
      if (expiredCount > 20) {
        logger.info(
          `Note: ${expiredCount - 20} battle(s) remaining, will be processed in next run`
        );
      }
    } catch (error) {
      logger.error("Error in checkExpiredBattles:", error);

      // Logger l'erreur globale
      await db.collection("error_logs").add({
        type: "checkExpiredBattles_global_error",
        error: error instanceof Error ? error.message : String(error),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
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
      return 2.0;
    case "championship":
      return 5.0;
    default:
      return 1.0;
  }
}

