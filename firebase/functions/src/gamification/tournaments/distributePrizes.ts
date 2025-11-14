import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

/**
 * Cloud Function pour distribuer automatiquement les récompenses
 * Se déclenche quand un tournoi passe à l'état "finished"
 */
export const distributePrizes = onDocumentUpdated(
  "tournaments/{tournamentId}",
  async (event) => {
    const db = admin.firestore();
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) {
      return;
    }

    // 1. Vérifier si le tournoi vient de se terminer
    if (before.phase !== "finished" && after.phase === "finished") {
      const tournamentId = event.params.tournamentId;
      logger.info(`Tournament ${tournamentId} finished, distributing prizes`);

      try {
        const tournament = after;
        const standings = tournament.standings || {};
        const prizes = tournament.prizes || [];

        if (prizes.length === 0) {
          logger.info(`No prizes to distribute for tournament ${tournamentId}`);
          return;
        }

        // 2. Convertir standings en array trié
        const rankedPlayers = Object.entries(standings)
          .map(([playerId, data]: [string, any]) => ({
            playerId,
            score: data.score || 0,
            rank: data.rank || 999,
          }))
          .sort((a, b) => a.rank - b.rank);

        logger.info(`Distributing prizes to ${rankedPlayers.length} players`);

        // 3. Distribuer les récompenses
        const batch = db.batch();
        let distributedCount = 0;

        for (const prize of prizes) {
          // Déterminer les gagnants selon le prize (ex: top 3)
          const position = prize.position || 1; // Position 1, 2, 3, etc.
          const player = rankedPlayers[position - 1];

          if (!player) {
            logger.warn(
              `No player at position ${position} for prize ${prize.id}`
            );
            continue;
          }

          const playerRef = db.collection("playerStats").doc(player.playerId);
          const rewardRef = db.collection("rewards").doc();

          // 4. Ajouter points/gems au joueur
          batch.update(playerRef, {
            totalPoints: admin.firestore.FieldValue.increment(
              prize.points || 0
            ),
            totalGems: admin.firestore.FieldValue.increment(prize.gems || 0),
            tournamentsWon: admin.firestore.FieldValue.increment(1),
            lastRewardAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // 5. Créer un enregistrement de récompense
          batch.set(rewardRef, {
            id: rewardRef.id,
            userId: player.playerId,
            type: prize.type || "tournament",
            name: prize.name,
            description: prize.description || `Récompense tournoi ${tournament.name || "Tournoi"}`,
            points: prize.points || 0,
            gems: prize.gems || 0,
            tournamentId,
            tournamentName: tournament.name || "Tournoi",
            position,
            isClaimed: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // 6. Créer une notification
          const notifRef = db.collection("notifications").doc();
          batch.set(notifRef, {
            id: notifRef.id,
            userId: player.playerId,
            type: "tournament_reward",
            title: "🏆 Félicitations !",
            message: `Vous avez terminé ${getOrdinal(position)} au tournoi "${tournament.name || "Tournoi"}" !`,
            data: {
              tournamentId,
              tournamentName: tournament.name || "Tournoi",
              position,
              rewardId: rewardRef.id,
              points: prize.points,
              gems: prize.gems,
            },
            isRead: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          distributedCount++;
          logger.info(
            `Prize distributed to ${player.playerId}: ${prize.name} (Position ${position})`
          );
        }

        // 7. Marquer le tournoi comme récompenses distribuées
        batch.update(db.collection("tournaments").doc(tournamentId), {
          prizesDistributed: true,
          prizesDistributedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 8. Analytics
        await db.collection("analytics").doc("tournaments").set(
          {
            totalPrizesDistributed: admin.firestore.FieldValue.increment(
              distributedCount
            ),
            lastPrizeDistributionAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // 9. Commit
        await batch.commit();
        logger.info(
          `Successfully distributed ${distributedCount} prizes for tournament ${tournamentId}`
        );
      } catch (error) {
        logger.error(`Error distributing prizes for tournament ${tournamentId}:`, error);
        throw error;
      }
    }

    return null;
  }
);

/**
 * Helper pour obtenir l'ordinal (1er, 2ème, 3ème)
 */
function getOrdinal(position: number): string {
  if (position === 1) return "1er";
  return `${position}ème`;
}

