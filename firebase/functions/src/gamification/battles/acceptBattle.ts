import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { validateAuthenticatedUser } from "../../middleware/auth.middleware";

interface AcceptBattleRequest {
  battleId: string;
}

/**
 * Cloud Function pour accepter une battle
 */
export const acceptBattle = onCall(
  async (request) => {
    const data = request.data as AcceptBattleRequest;
    const context = request.auth;

    // Vérifier l'authentification avec rate limiting
    if (!context || !validateAuthenticatedUser(context, "acceptBattle")) {
      throw new HttpsError(
        "unauthenticated",
        "L'utilisateur doit être authentifié"
      );
    }

    const { battleId } = data;
    const userId = context.uid;
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

    // Vérifier que c'est le player2 qui accepte
    if (battle.player2Id !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Seul le joueur invité peut accepter"
      );
    }

    // Vérifier le status
    if (battle.status !== "pending") {
      throw new HttpsError(
        "failed-precondition",
        "La battle n'est plus en attente"
      );
    }

    // Mettre à jour le status
    await battleRef.update({
      status: "active",
      startTime: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      message: "Battle acceptée !",
    };
  }
);

