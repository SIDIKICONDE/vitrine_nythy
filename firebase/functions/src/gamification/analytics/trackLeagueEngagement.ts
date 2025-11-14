import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";

/**
 * Cloud Function pour tracker l'engagement par ligue
 * S'exécute quotidiennement pour calculer les métriques
 */
export const trackLeagueEngagement = onSchedule(
  {
    schedule: "every day 03:00",
    timeZone: "Europe/Paris",
    region: "europe-west1",
  },
  async (event) => {
    const db = admin.firestore();
    logger.info("Starting league engagement tracking");

    try {
      // 1. Récupérer toutes les ligues actives
      const leaguesSnapshot = await db
        .collection("leagues")
        .where("endDate", ">", admin.firestore.Timestamp.now())
        .get();

      logger.info(`Tracking engagement for ${leaguesSnapshot.size} leagues`);

      const batch = db.batch();
      const engagementData: Array<{
        leagueId: string;
        tier: string;
        engagement: number;
      }> = [];

      // 2. Calculer l'engagement pour chaque ligue
      for (const doc of leaguesSnapshot.docs) {
        const league = doc.data();
        const leagueId = doc.id;

        // Récupérer les stats des joueurs de cette ligue
        const playersSnapshot = await db
          .collection("playerStats")
          .where("currentLeagueTier", "==", league.tier)
          .where("currentSeasonId", "==", league.seasonId)
          .get();

        const totalPlayers = playersSnapshot.size;
        let activePlayers = 0;
        let totalBattles = 0;
        let totalPoints = 0;

        // 3. Calculer les métriques d'engagement
        const now = Date.now();
        const last7Days = now - 7 * 24 * 60 * 60 * 1000;

        for (const playerDoc of playersSnapshot.docs) {
          const player = playerDoc.data();

          // Joueur actif = a joué dans les 7 derniers jours
          const lastActivity = player.lastActivityAt?.toMillis() || 0;
          if (lastActivity > last7Days) {
            activePlayers++;
          }

          totalBattles += player.battlesPlayed || 0;
          totalPoints += player.totalPoints || 0;
        }

        // 4. Calculer le score d'engagement (0-100)
        const activePlayerRate = totalPlayers > 0 ? activePlayers / totalPlayers : 0;
        const avgBattlesPerPlayer = totalPlayers > 0 ? totalBattles / totalPlayers : 0;
        const avgPointsPerPlayer = totalPlayers > 0 ? totalPoints / totalPlayers : 0;

        const engagementScore =
          activePlayerRate * 50 + // 50% pour taux de joueurs actifs
          Math.min(avgBattlesPerPlayer / 10, 1) * 30 + // 30% pour moyenne battles
          Math.min(avgPointsPerPlayer / 1000, 1) * 20; // 20% pour moyenne points

        // 5. Mettre à jour les analytics de la ligue
        const leagueAnalyticsRef = db
          .collection("analytics")
          .doc("leagues")
          .collection("byLeague")
          .doc(leagueId);

        batch.set(
          leagueAnalyticsRef,
          {
            leagueId,
            tier: league.tier,
            seasonId: league.seasonId,
            totalPlayers,
            activePlayers,
            activePlayerRate,
            totalBattles,
            avgBattlesPerPlayer,
            totalPoints,
            avgPointsPerPlayer,
            engagementScore,
            calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // 6. Mettre à jour la ligue elle-même
        batch.update(doc.ref, {
          engagementScore,
          activePlayers,
          lastEngagementUpdate: admin.firestore.FieldValue.serverTimestamp(),
        });

        engagementData.push({
          leagueId,
          tier: league.tier,
          engagement: engagementScore,
        });

        logger.info(
          `League ${leagueId} (${league.tier}): ${activePlayers}/${totalPlayers} active, score: ${engagementScore.toFixed(2)}`
        );
      }

      // 7. Sauvegarder les analytics globales
      const globalAnalyticsRef = db.collection("analytics").doc("leagues");

      // Calculer engagement moyen par tier
      const engagementByTier: Record<string, number> = {};
      const countByTier: Record<string, number> = {};

      for (const data of engagementData) {
        if (!engagementByTier[data.tier]) {
          engagementByTier[data.tier] = 0;
          countByTier[data.tier] = 0;
        }
        engagementByTier[data.tier] += data.engagement;
        countByTier[data.tier]++;
      }

      const avgEngagementByTier: Record<string, number> = {};
      for (const tier in engagementByTier) {
        avgEngagementByTier[tier] = engagementByTier[tier] / countByTier[tier];
      }

      batch.set(
        globalAnalyticsRef,
        {
          avgEngagementByTier,
          totalLeaguesTracked: engagementData.length,
          lastEngagementCalculation: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();
      logger.info(`Engagement tracked for ${engagementData.length} leagues`);
    } catch (error) {
      logger.error("Error tracking league engagement:", error);
      throw error;
    }
  }
);

