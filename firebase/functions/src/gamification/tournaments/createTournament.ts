import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { validateAdminRole, validateAuthenticatedUser } from "../../middleware/auth.middleware";

/**
 * Cloud Function pour créer un nouveau tournoi (Admin uniquement)
 * 
 * @param {object} data - Données du tournoi
 * @returns {object} Tournoi créé avec son ID
 */
export const createTournament = onCall(
  {
    region: "europe-west1",
    maxInstances: 10,
  },
  async (request) => {
    const db = admin.firestore();
    const auth = request.auth;

    // 1. Vérifier l'authentification avec rate limiting
    if (!validateAuthenticatedUser(auth, "createTournament")) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    // 2. Type guard : après validateAuthenticatedUser, auth est garanti non-undefined
    if (!auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    // 3. Vérifier les permissions admin avec logging de sécurité
    const isAdmin = await validateAdminRole(auth, db);

    if (!isAdmin) {
      throw new HttpsError(
        "permission-denied",
        "Only administrators can create tournaments"
      );
    }

    // 4. Valider les données
    const {
      name,
      description,
      startDate,
      endDate,
      registrationEndDate,
      maxParticipants,
      prizes,
      requirements,
      imageUrl,
      isPublic = true,
    } = request.data;

    if (!name || !description || !startDate || !endDate) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: name, description, startDate, endDate"
      );
    }

    // Valider les dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      throw new HttpsError(
        "invalid-argument",
        "Start date must be before end date"
      );
    }

    if (start < now) {
      throw new HttpsError(
        "invalid-argument",
        "Start date must be in the future"
      );
    }

    try {
      // 4. Créer le tournoi
      const tournamentRef = db.collection("tournaments").doc();
      const tournamentData = {
        id: tournamentRef.id,
        name,
        description,
        startDate: admin.firestore.Timestamp.fromDate(start),
        endDate: admin.firestore.Timestamp.fromDate(end),
        registrationEndDate: registrationEndDate
          ? admin.firestore.Timestamp.fromDate(new Date(registrationEndDate))
          : null,
        phase: "registration",
        maxParticipants: maxParticipants || 0,
        currentParticipants: 0,
        participantIds: [],
        prizes: prizes || [],
        prizePoolPoints: prizes?.reduce(
          (sum: number, prize: any) => sum + (prize.points || 0),
          0
        ) || 0,
        standings: {},
        isPublic,
        requirements: requirements || [],
        imageUrl: imageUrl || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: auth.uid,
      };

      await tournamentRef.set(tournamentData);

      // 5. Logger l'événement
      logger.info(`Tournament created: ${tournamentRef.id} by ${auth.uid}`, {
        tournamentId: tournamentRef.id,
        name,
        adminId: auth.uid,
      });

      // 6. Tracker l'analytics
      await db.collection("analytics").doc("tournaments").set(
        {
          totalCreated: admin.firestore.FieldValue.increment(1),
          lastCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return {
        success: true,
        tournamentId: tournamentRef.id,
        tournament: tournamentData,
      };
    } catch (error) {
      logger.error("Error creating tournament:", error);
      throw new HttpsError("internal", "Failed to create tournament");
    }
  }
);

