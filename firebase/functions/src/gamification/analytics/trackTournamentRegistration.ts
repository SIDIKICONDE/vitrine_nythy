import * as admin from "firebase-admin";
import {onDocumentUpdated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

/**
 * Cloud Function pour tracker les inscriptions aux tournois
 * Se déclenche à chaque mise à jour d'un tournoi
 */
export const trackTournamentRegistration = onDocumentUpdated(
  "tournaments/{tournamentId}",
  async (event) => {
    const db = admin.firestore();
    const before = event.data?.before.data();
    const after = event.data?.after.data();

    if (!before || !after) {
      return;
    }

    const tournamentId = event.params.tournamentId;

    // 1. Détecter une nouvelle inscription
    const participantsBefore = before.participantIds?.length || 0;
    const participantsAfter = after.participantIds?.length || 0;

    if (participantsAfter > participantsBefore) {
      // Nouvelle inscription détectée
      const newParticipants = after.participantIds?.filter(
        (id: string) => !before.participantIds?.includes(id)
      ) || [];

      logger.info(
        `New registration(s) detected for tournament ${tournamentId}: ${newParticipants.length}`
      );

      try {
        const batch = db.batch();

        // 2. Mettre à jour les analytics globales
        const globalAnalyticsRef = db
          .collection("analytics")
          .doc("tournaments");
        batch.set(
          globalAnalyticsRef,
          {
            totalRegistrations: admin.firestore.FieldValue.increment(
              newParticipants.length
            ),
            lastRegistrationAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          {merge: true}
        );

        // 3. Mettre à jour les analytics du tournoi
        const tournamentAnalyticsRef = db
          .collection("analytics")
          .doc("tournaments")
          .collection("byTournament")
          .doc(tournamentId);

        batch.set(
          tournamentAnalyticsRef,
          {
            tournamentId,
            tournamentName: after.name,
            totalRegistrations: participantsAfter,
            registrationRate: participantsAfter / (after.maxParticipants || 100),
            lastRegistrationAt: admin.firestore.FieldValue.serverTimestamp(),
            registrations: admin.firestore.FieldValue.arrayUnion(
              ...newParticipants.map((playerId: string) => ({
                playerId,
                timestamp: admin.firestore.Timestamp.now(),
              }))
            ),
          },
          {merge: true}
        );

        // 4. Mettre à jour les analytics par joueur
        for (const playerId of newParticipants) {
          const playerAnalyticsRef = db
            .collection("analytics")
            .doc("players")
            .collection("byPlayer")
            .doc(playerId);

          batch.set(
            playerAnalyticsRef,
            {
              playerId,
              totalTournamentRegistrations: admin.firestore.FieldValue.increment(1),
              lastTournamentRegistration: admin.firestore.FieldValue.serverTimestamp(),
              tournamentsRegistered: admin.firestore.FieldValue.arrayUnion(
                tournamentId
              ),
            },
            {merge: true}
          );
        }

        await batch.commit();
        logger.info(
          `Analytics updated for ${newParticipants.length} new registrations`
        );
      } catch (error) {
        logger.error("Error tracking tournament registrations:", error);
      }
    }

    // 5. Détecter une désinscription
    if (participantsAfter < participantsBefore) {
      const removedParticipants = before.participantIds?.filter(
        (id: string) => !after.participantIds?.includes(id)
      ) || [];

      logger.info(
        `Unregistration(s) detected for tournament ${tournamentId}: ${removedParticipants.length}`
      );

      try {
        await db
          .collection("analytics")
          .doc("tournaments")
          .set(
            {
              totalUnregistrations: admin.firestore.FieldValue.increment(
                removedParticipants.length
              ),
            },
            {merge: true}
          );
      } catch (error) {
        logger.error("Error tracking tournament unregistrations:", error);
      }
    }

    return null;
  }
);

