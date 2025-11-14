import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";

/**
 * Cloud Function pour avancer automatiquement les phases des tournois
 * S'exécute toutes les 6 heures pour vérifier les tournois
 *
 * Optimisation : Les phases durent minimum 3 jours, donc une vérification
 * toutes les 6 heures est suffisante pour la plupart des cas.
 *
 * Note: Pour les phases critiques (fin d'inscription), envisager un trigger
 * séparé si nécessaire pour une précision temporelle accrue.
 */
export const advanceTournamentPhase = onSchedule(
  {
    schedule: "every 6 hours",
    timeZone: "Europe/Paris",
    region: "europe-west1",
  },
  async (event) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    logger.info("Starting tournament phase advancement check");

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

      logger.info(`Found ${tournamentsSnapshot.size} active tournaments`);

      const batch = db.batch();
      let processedCount = 0;

      for (const doc of tournamentsSnapshot.docs) {
        const tournament = doc.data();
        const tournamentRef = doc.ref;
        let shouldAdvance = false;
        let newPhase = tournament.phase;

        // 2. Logique d'avancement selon la phase actuelle
        switch (tournament.phase) {
          case "registration":
            // Avancer si la date de fin d'inscription est passée
            if (
              tournament.registrationEndDate &&
              tournament.registrationEndDate.toMillis() < now.toMillis()
            ) {
              shouldAdvance = true;
              newPhase = "qualifications";
              logger.info(
                `Tournament ${doc.id}: Registration ended, advancing to qualifications`
              );
            }
            break;

          case "qualifications":
            // Avancer après X jours (ex: 3 jours)
            const qualificationsDuration = 3 * 24 * 60 * 60 * 1000; // 3 jours
            const phaseStart = tournament.updatedAt?.toMillis() || now.toMillis();
            if (now.toMillis() - phaseStart > qualificationsDuration) {
              shouldAdvance = true;
              newPhase = "groups";
              logger.info(
                `Tournament ${doc.id}: Qualifications complete, advancing to groups`
              );
            }
            break;

          case "groups":
            // Avancer après X jours (ex: 5 jours)
            const groupsDuration = 5 * 24 * 60 * 60 * 1000; // 5 jours
            const groupsStart = tournament.updatedAt?.toMillis() || now.toMillis();
            if (now.toMillis() - groupsStart > groupsDuration) {
              shouldAdvance = true;
              newPhase = "playoffs";
              logger.info(
                `Tournament ${doc.id}: Groups complete, advancing to playoffs`
              );
            }
            break;

          case "playoffs":
            // Avancer après X jours (ex: 3 jours)
            const playoffsDuration = 3 * 24 * 60 * 60 * 1000; // 3 jours
            const playoffsStart = tournament.updatedAt?.toMillis() || now.toMillis();
            if (now.toMillis() - playoffsStart > playoffsDuration) {
              shouldAdvance = true;
              newPhase = "final";
              logger.info(
                `Tournament ${doc.id}: Playoffs complete, advancing to finals`
              );
            }
            break;

          case "final":
            // Terminer le tournoi si la date de fin est passée
            if (tournament.endDate.toMillis() < now.toMillis()) {
              shouldAdvance = true;
              newPhase = "finished";
              logger.info(
                `Tournament ${doc.id}: Finals complete, tournament finished`
              );
            }
            break;
        }

        // 3. Mettre à jour si nécessaire
        if (shouldAdvance) {
          batch.update(tournamentRef, {
            phase: newPhase,
            previousPhase: tournament.phase,
            phaseChangedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          processedCount++;

          // 4. Tracker l'analytics
          await db.collection("analytics").doc("tournaments").set(
            {
              [`phaseAdvanced_${tournament.phase}_to_${newPhase}`]:
                admin.firestore.FieldValue.increment(1),
            },
            { merge: true }
          );

          // 5. Si terminé, déclencher la distribution des récompenses
          if (newPhase === "finished") {
            logger.info(
              `Tournament ${doc.id} finished, triggering prize distribution`
            );
            // La distribution sera gérée par un autre trigger
          }
        }
      }

      // 6. Commit les changements
      if (processedCount > 0) {
        await batch.commit();
        logger.info(`Advanced ${processedCount} tournaments to next phase`);
      } else {
        logger.info("No tournaments needed phase advancement");
      }

    } catch (error) {
      logger.error("Error advancing tournament phases:", error);
      throw error;
    }
  }
);

/**
 * Cloud Function pour vérifier les deadlines d'inscription critiques
 * S'exécute toutes les heures pour une précision maximale
 *
 * Responsabilités :
 * - Détecter les fins d'inscription dans l'heure qui suit
 * - Avancer automatiquement vers la phase qualifications
 * - Notifications aux joueurs si nécessaire
 */
export const checkRegistrationDeadlines = onSchedule(
  {
    schedule: "every 1 hours",
    timeZone: "Europe/Paris",
    region: "europe-west1",
  },
  async (event) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();
    const oneHourFromNow = new Date(now.toMillis() + 60 * 60 * 1000);

    logger.info("Starting critical registration deadline check");

    try {
      // 1. Trouver les tournois en phase "registration" dont la deadline
      // arrive dans l'heure qui suit
      const criticalTournamentsSnapshot = await db
        .collection("tournaments")
        .where("phase", "==", "registration")
        .where("registrationEndDate", "<=", admin.firestore.Timestamp.fromDate(oneHourFromNow))
        .get();

      logger.info(
        `Found ${criticalTournamentsSnapshot.size} tournaments with critical registration deadlines`
      );

      if (criticalTournamentsSnapshot.size === 0) {
        return;
      }

      const batch = db.batch();
      let processedCount = 0;

      for (const doc of criticalTournamentsSnapshot.docs) {
        const tournament = doc.data();

        // Double vérification : la deadline est-elle vraiment dépassée ?
        if (tournament.registrationEndDate.toMillis() <= now.toMillis()) {
          logger.info(
            `Tournament ${doc.id}: Registration deadline reached, advancing to qualifications`
          );

          batch.update(doc.ref, {
            phase: "qualifications",
            previousPhase: "registration",
            phaseChangedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          processedCount++;

          // Analytics
          await db.collection("analytics").doc("tournaments").set(
            {
              phaseAdvanced_registration_to_qualifications: admin.firestore.FieldValue.increment(1),
              criticalDeadlineAdvancements: admin.firestore.FieldValue.increment(1),
            },
            { merge: true }
          );
        }
      }

      // 2. Commit si nécessaire
      if (processedCount > 0) {
        await batch.commit();
        logger.info(`Advanced ${processedCount} tournaments from critical deadlines`);
      }

    } catch (error) {
      logger.error("Error in checkRegistrationDeadlines:", error);
      throw error;
    }
  }
);

