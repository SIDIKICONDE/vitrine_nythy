import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";

/**
 * Cloud Function pour calculer la popularité des tournois
 * S'exécute quotidiennement pour mettre à jour les métriques
 */
export const trackTournamentPopularity = onSchedule(
  {
    schedule: "every day 02:00",
    timeZone: "Europe/Paris",
    region: "europe-west1",
  },
  async (event) => {
    const db = admin.firestore();
    logger.info("Starting tournament popularity calculation");

    try {
      // 1. Récupérer tous les tournois actifs
      const tournamentsSnapshot = await db
        .collection("tournaments")
        .where("phase", "in", [
          "registration",
          "qualifications",
          "groups",
          "playoffs",
          "final",
        ])
        .get();

      logger.info(
        `Calculating popularity for ${tournamentsSnapshot.size} tournaments`
      );

      const batch = db.batch();
      const popularityScores: Array<{
        tournamentId: string;
        name: string;
        score: number;
      }> = [];

      // 2. Calculer le score de popularité pour chaque tournoi
      for (const doc of tournamentsSnapshot.docs) {
        const tournament = doc.data();
        const tournamentId = doc.id;

        // Facteurs de popularité (pondérés)
        const registrationRate =
          tournament.currentParticipants /
          (tournament.maxParticipants || 100);
        const fillRate = Math.min(registrationRate, 1.0);

        // Récupérer les analytics du tournoi
        const analyticsDoc = await db
          .collection("analytics")
          .doc("tournaments")
          .collection("byTournament")
          .doc(tournamentId)
          .get();

        const analytics = analyticsDoc.data() || {};

        // Formule de popularité (score sur 100)
        const popularityScore =
          fillRate * 40 + // 40% pour le taux de remplissage
          Math.min((analytics.totalRegistrations || 0) / 50, 1) * 30 + // 30% pour nombre d'inscriptions
          Math.min((analytics.viewCount || 0) / 100, 1) * 20 + // 20% pour vues
          Math.min((analytics.shareCount || 0) / 10, 1) * 10; // 10% pour partages

        // 3. Mettre à jour le score de popularité
        batch.update(doc.ref, {
          popularityScore,
          popularityRank: 0, // Sera mis à jour après le tri
          lastPopularityUpdate: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Mettre à jour les analytics
        const analyticsRef = db
          .collection("analytics")
          .doc("tournaments")
          .collection("byTournament")
          .doc(tournamentId);

        batch.set(
          analyticsRef,
          {
            popularityScore,
            fillRate,
            calculatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        popularityScores.push({
          tournamentId,
          name: tournament.name,
          score: popularityScore,
        });
      }

      // 4. Trier par popularité et assigner les rangs
      popularityScores.sort((a, b) => b.score - a.score);

      for (let i = 0; i < popularityScores.length; i++) {
        const tournamentRef = db
          .collection("tournaments")
          .doc(popularityScores[i].tournamentId);
        batch.update(tournamentRef, {
          popularityRank: i + 1,
        });
      }

      // 5. Sauvegarder le top 10 dans analytics
      const top10 = popularityScores.slice(0, 10);
      await db
        .collection("analytics")
        .doc("tournaments")
        .set(
          {
            topPopular: top10,
            lastPopularityCalculation: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

      await batch.commit();
      logger.info(`Popularity calculated for ${popularityScores.length} tournaments`);
    } catch (error) {
      logger.error("Error calculating tournament popularity:", error);
      throw error;
    }
  }
);

