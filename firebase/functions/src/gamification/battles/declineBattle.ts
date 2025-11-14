import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { validateAuthenticatedUser } from "../../middleware/auth.middleware";

interface DeclineBattleRequest {
  battleId: string;
}

/**
 * Cloud Function pour refuser une battle
 */
export const declineBattle = onCall(async (request) => {
  const data = request.data as DeclineBattleRequest;
  const context = request.auth;

  if (!context || !validateAuthenticatedUser(context, "declineBattle")) {
    throw new HttpsError(
      "unauthenticated",
      "L'utilisateur doit être authentifié",
    );
  }

  const { battleId } = data;
  const userId = context.uid;
  const db = admin.firestore();

  const battleRef = db.collection("battles").doc(battleId);
  const battleDoc = await battleRef.get();

  if (!battleDoc.exists) {
    throw new HttpsError("not-found", "Battle introuvable");
  }

  const battle = battleDoc.data()!;

  // Seul le joueur invité (player2) peut refuser
  if (battle.player2Id !== userId) {
    throw new HttpsError(
      "permission-denied",
      "Seul le joueur invité peut refuser la battle",
    );
  }

  if (battle.status !== "pending") {
    throw new HttpsError(
      "failed-precondition",
      "La battle n'est plus en attente",
    );
  }

  await battleRef.update({
    status: "cancelled",
    cancelledBy: userId,
    cancellationReason: "declined",
    finishedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    message: "Battle refusée",
  };
});

