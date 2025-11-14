import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { validateAuthenticatedUser } from "../../middleware/auth.middleware";

interface UpdateScoreRequest {
  battleId: string;
  scoreToAdd: number;
}

/**
 * Cloud Function sécurisée pour mettre à jour le score
 * 
 * Anti-cheat :
 * - Vérifier que c'est un participant
 * - Limiter l'augmentation de score (max 1000 par appel)
 * - Vérifier le timestamp (pas de spam)
 */
export const updateBattleScore = onCall(
  async (request) => {
    const data = request.data as UpdateScoreRequest;
    const context = request.auth;

    // Vérifier l'authentification avec rate limiting
    if (!context || !validateAuthenticatedUser(context, "updateBattleScore")) {
      throw new HttpsError(
        "unauthenticated",
        "L'utilisateur doit être authentifié"
      );
    }

    const { battleId, scoreToAdd } = data;
    const userId = context.uid;

    // Validation du score
    if (scoreToAdd < 0 || scoreToAdd > 1000) {
      throw new HttpsError(
        "invalid-argument",
        "Score invalide (0-1000)"
      );
    }

    const db = admin.firestore();
    const battleRef = db.collection("battles").doc(battleId);
    const battleDoc = await battleRef.get();

    if (!battleDoc.exists) {
      throw new HttpsError(
        "not-found",
        "Battle introuvable"
      );
    }

    const battle = battleDoc.data()!;

    // Vérifier que c'est un participant
    if (battle.player1Id !== userId && battle.player2Id !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Vous n'êtes pas participant"
      );
    }

    // Vérifier le status
    if (battle.status !== "active") {
      throw new HttpsError(
        "failed-precondition",
        "La battle n'est pas active"
      );
    }

    // Mettre à jour le score
    const isPlayer1 = battle.player1Id === userId;
    const updateField = isPlayer1 ? "player1Score" : "player2Score";

    await battleRef.update({
      [updateField]: admin.firestore.FieldValue.increment(scoreToAdd),
    });

    return {
      success: true,
      scoreAdded: scoreToAdd,
    };
  }
);

