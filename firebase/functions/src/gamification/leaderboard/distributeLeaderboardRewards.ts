import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";

/**
 * Cloud Function programmée pour distribuer automatiquement les récompenses
 * du leaderboard aux top joueurs
 *
 * ⏰ Programmation recommandée :
 * - Hebdomadaire : Chaque dimanche à 23h59
 * - Mensuel : Le dernier jour du mois à 23h59
 *
 * Récompenses distribuées :
 * - Top 1 : 200 gems + 1000 points + Badge "Champion"
 * - Top 2 : 150 gems + 750 points + Badge "Vice-Champion"
 * - Top 3 : 100 gems + 500 points + Badge "Podium"
 * - Top 4-10 : 75 gems + 400 points + Badge "Top 10"
 * - Top 11-100 : 50 gems + 250 points + Badge "Top 100"
 * - Top 101-500 : 25 gems + 100 points + Badge "Top 500"
 */

// Récompenses selon le rang
const RANK_REWARDS: Record<number, {
  gems: number;
  points: number;
  badge: string;
  title: string;
}> = {
  1: { gems: 200, points: 1000, badge: "champion", title: "Champion Nythy" },
  2: { gems: 150, points: 750, badge: "vice_champion", title: "Vice-Champion" },
  3: { gems: 100, points: 500, badge: "podium", title: "Top 3" },
};

const TOP_10_REWARD = { gems: 75, points: 400, badge: "top_10", title: "Top 10" };
const TOP_100_REWARD = { gems: 50, points: 250, badge: "top_100", title: "Top 100" };
const TOP_500_REWARD = { gems: 25, points: 100, badge: "top_500", title: "Top 500" };

/**
 * Fonction programmée pour distribuer les récompenses hebdomadaires
 * 
 * Configuration dans Firebase Console :
 * - Schedule: "0 23 * * 0" (chaque dimanche à 23h00)
 * - Timezone: Europe/Paris
 */
export const distributeWeeklyLeaderboardRewards = onSchedule(
  {
    schedule: "0 23 * * 0", // Chaque dimanche à 23h00
    timeZone: "Europe/Paris",
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async (event) => {
    const seasonId = getSeasonId("weekly");
    return distributeRewards(seasonId, "weekly");
  }
);

/**
 * Fonction programmée pour distribuer les récompenses mensuelles
 * 
 * Configuration dans Firebase Console :
 * - Schedule: "0 23 28-31 * *" (dernier jour du mois à 23h00)
 * - Timezone: Europe/Paris
 */
export const distributeMonthlyLeaderboardRewards = onSchedule(
  {
    schedule: "0 23 28-31 * *", // Dernier jour du mois à 23h00
    timeZone: "Europe/Paris",
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async (event) => {
    const seasonId = getSeasonId("monthly");
    return distributeRewards(seasonId, "monthly");
  }
);

/**
 * Fonction HTTP pour distribuer manuellement les récompenses
 * (peut être appelée depuis l'admin panel)
 */
export const distributeLeaderboardRewards = onSchedule(
  {
    schedule: "every 1 hours", // Désactivé par défaut (peut être appelé manuellement)
    timeZone: "Europe/Paris",
    memory: "512MiB",
    timeoutSeconds: 540,
  },
  async () => {
    // Utiliser la date actuelle pour générer le seasonId
    const seasonId = getSeasonId("weekly");
    return distributeRewards(seasonId, "weekly");
  }
);

/**
 * Fonction principale pour distribuer les récompenses
 */
async function distributeRewards(
  seasonId: string,
  period: "weekly" | "monthly"
): Promise<void> {
  const db = admin.firestore();
  logger.info(`🏆 [LeaderboardRewards] Distribution des récompenses ${period} (${seasonId})`);

  try {
    // Récupérer le leaderboard global (top 500)
    const leaderboardSnapshot = await db
      .collection("player_stats")
      .orderBy("totalPoints", "desc")
      .limit(500)
      .get();

    if (leaderboardSnapshot.empty) {
      logger.warn("⚠️ [LeaderboardRewards] Aucun joueur dans le leaderboard");
      return;
    }

    let rewardsDistributed = 0;
    let totalGemsDistributed = 0;
    let totalPointsDistributed = 0;

    const batch = db.batch();
    const rewardCollection = db.collection("player_rewards");

    // Traiter chaque joueur du leaderboard
    leaderboardSnapshot.docs.forEach((doc, index) => {
      const rank = index + 1;
      const playerId = doc.id;
      const playerData = doc.data();

      // Déterminer la récompense selon le rang
      let reward: typeof RANK_REWARDS[1] | typeof TOP_10_REWARD | typeof TOP_100_REWARD | typeof TOP_500_REWARD | null = null;

      if (rank === 1) {
        reward = RANK_REWARDS[1];
      } else if (rank === 2) {
        reward = RANK_REWARDS[2];
      } else if (rank === 3) {
        reward = RANK_REWARDS[3];
      } else if (rank >= 4 && rank <= 10) {
        reward = TOP_10_REWARD;
      } else if (rank >= 11 && rank <= 100) {
        reward = TOP_100_REWARD;
      } else if (rank >= 101 && rank <= 500) {
        reward = TOP_500_REWARD;
      }

      if (!reward) {
        return; // Pas de récompense pour ce rang
      }

      // Créer le document de récompense
      const rewardId = `${seasonId}_${playerId}_${rank}`;
      const rewardRef = rewardCollection.doc(rewardId);

      batch.set(rewardRef, {
        playerId,
        seasonId,
        period,
        rank,
        prize: {
          type: "leaderboard",
          gems: reward.gems,
          points: reward.points,
          badge: reward.badge,
          title: reward.title,
        },
        distributedAt: admin.firestore.FieldValue.serverTimestamp(),
        claimed: false,
      }, { merge: true });

      // Mettre à jour les stats du joueur (gems et points)
      const statsRef = db.collection("player_stats").doc(playerId);
      batch.update(statsRef, {
        totalGems: admin.firestore.FieldValue.increment(reward.gems),
        totalPoints: admin.firestore.FieldValue.increment(reward.points),
        earnedBadges: admin.firestore.FieldValue.arrayUnion(reward.badge),
        lastRewardAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      rewardsDistributed++;
      totalGemsDistributed += reward.gems;
      totalPointsDistributed += reward.points;

      logger.info(
        `✅ [LeaderboardRewards] Rang ${rank} (${playerData.displayName || playerId}): ` +
        `+${reward.gems} gems, +${reward.points} points, badge: ${reward.badge}`
      );
    });

    // Exécuter le batch
    await batch.commit();

    logger.info(
      `🎉 [LeaderboardRewards] Distribution terminée: ` +
      `${rewardsDistributed} joueurs, ` +
      `${totalGemsDistributed} gems, ` +
      `${totalPointsDistributed} points`
    );
  } catch (error) {
    logger.error("❌ [LeaderboardRewards] Erreur lors de la distribution:", error);
    throw error;
  }
}

/**
 * Génère un ID de saison basé sur la période
 */
function getSeasonId(period: "weekly" | "monthly"): string {
  const now = new Date();
  
  if (period === "weekly") {
    // Format: YYYY-WW (ex: 2024-W15)
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, "0")}`;
  } else {
    // Format: YYYY-MM (ex: 2024-03)
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    return `${year}-${month}`;
  }
}

