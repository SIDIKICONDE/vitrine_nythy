import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { validateAuthenticatedUser } from "../../middleware/auth.middleware";

interface CancelBattleRequest {
  battleId: string;
}

/**
 * Cloud Function pour annuler une battle (participants uniquement)
 */
export const cancelBattle = onCall(async (request) => {
  const data = request.data as CancelBattleRequest;
  const context = request.auth;

  if (!context || !validateAuthenticatedUser(context, "cancelBattle")) {
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

  const isParticipant = battle.player1Id === userId || battle.player2Id === userId;
  if (!isParticipant && !context.token?.admin) {
    throw new HttpsError(
      "permission-denied",
      "Seuls les participants peuvent annuler la battle",
    );
  }

  if (!["pending", "active"].includes(battle.status)) {
    throw new HttpsError(
      "failed-precondition",
      "La battle ne peut plus être annulée",
    );
  }

  await battleRef.update({
    status: "cancelled",
    cancelledBy: userId,
    cancellationReason: "user_cancelled",
    finishedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    success: true,
    message: "Battle annulée",
  };
});

