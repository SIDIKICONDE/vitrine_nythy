import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { validateAuthenticatedUser } from "../../middleware/auth.middleware";

interface CompleteBattleRequest {
  battleId: string;
}

/**
 * Cloud Function sécurisée pour terminer une battle
 * 
 * Responsabilités :
 * - Calculer le gagnant
 * - Distribuer les points avec multiplicateurs
 * - Mettre à jour les stats atomiquement
 * - Créer les notifications
 * - Logger pour analytics
 */
export const completeBattle = onCall(
  async (request) => {
    const data = request.data as CompleteBattleRequest;
    const context = request.auth;

    // 1. Vérifier l'authentification avec rate limiting
    if (!context || !validateAuthenticatedUser(context, "completeBattle")) {
      throw new HttpsError(
        "unauthenticated",
        "L'utilisateur doit être authentifié"
      );
    }

    const { battleId } = data;
    const db = admin.firestore();

    // 2. Récupérer la battle
    const battleRef = db.collection("battles").doc(battleId);
    const battleDoc = await battleRef.get();

    if (!battleDoc.exists) {
      throw new HttpsError(
        "not-found",
        "Battle introuvable"
      );
    }

    const battle = battleDoc.data()!;

    // 3. Vérifier que l'utilisateur est participant
    const userId = context.uid;
    if (battle.player1Id !== userId &&
      battle.player2Id !== userId) {
      throw new HttpsError(
        "permission-denied",
        "Vous n'êtes pas participant de cette battle"
      );
    }

    // 4. Vérifier que la battle n'est pas déjà terminée
    if (battle.status === "finished" ||
      battle.status === "cancelled" ||
      battle.status === "expired") {
      throw new HttpsError(
        "failed-precondition",
        "La battle est déjà terminée"
      );
    }

    // 5. Calculer le gagnant
    const player1Score = Number(battle.player1Score) || 0;
    const player2Score = Number(battle.player2Score) || 0;

    const winner = player1Score > player2Score ?
      battle.player1Id :
      (player2Score > player1Score ?
        battle.player2Id :
        null); // Égalité

    // 6. Calculer les points avec multiplicateurs
    const scoreDifference = Math.abs(player1Score - player2Score);
    const basePoints = 500;
    const loserConsolation = 50;
    const drawPoints = 250; // Moitié des points de base pour un match nul
    const typeMultiplier = getTypeMultiplier(battle.type);

    const player1PointsAward = winner === battle.player1Id ?
      Math.floor((basePoints + scoreDifference * 10) * typeMultiplier) :
      (winner === battle.player2Id ? loserConsolation : drawPoints);

    const player2PointsAward = winner === battle.player2Id ?
      Math.floor((basePoints + scoreDifference * 10) * typeMultiplier) :
      (winner === battle.player1Id ? loserConsolation : drawPoints);

    // 7. Utiliser un batch pour atomicité
    const batch = db.batch();

    // Mettre à jour la battle
    batch.update(battleRef, {
      status: "finished",
      winnerId: winner,
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const player1StatsUpdate: admin.firestore.UpdateData<any> = {
      userId: battle.player1Id,
      battlesPlayed: admin.firestore.FieldValue.increment(1),
      totalPoints: admin.firestore.FieldValue.increment(player1PointsAward),
      lastBattleAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (winner === battle.player1Id) {
      player1StatsUpdate.battlesWon = admin.firestore.FieldValue.increment(1);
      player1StatsUpdate.currentStreak = admin.firestore.FieldValue.increment(1);
    } else if (winner === battle.player2Id) {
      player1StatsUpdate.battlesLost = admin.firestore.FieldValue.increment(1);
      player1StatsUpdate.currentStreak = 0;
    } else {
      player1StatsUpdate.currentStreak = 0;
    }

    // Mettre à jour player1 stats
    const player1StatsRef = db.collection("player_stats")
      .doc(battle.player1Id);
    batch.set(player1StatsRef, player1StatsUpdate, { merge: true });

    const player2StatsUpdate: admin.firestore.UpdateData<any> = {
      userId: battle.player2Id,
      battlesPlayed: admin.firestore.FieldValue.increment(1),
      totalPoints: admin.firestore.FieldValue.increment(player2PointsAward),
      lastBattleAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (winner === battle.player2Id) {
      player2StatsUpdate.battlesWon = admin.firestore.FieldValue.increment(1);
      player2StatsUpdate.currentStreak = admin.firestore.FieldValue.increment(1);
    } else if (winner === battle.player1Id) {
      player2StatsUpdate.battlesLost = admin.firestore.FieldValue.increment(1);
      player2StatsUpdate.currentStreak = 0;
    } else {
      player2StatsUpdate.currentStreak = 0;
    }

    // Mettre à jour player2 stats
    const player2StatsRef = db.collection("player_stats")
      .doc(battle.player2Id);
    batch.set(player2StatsRef, player2StatsUpdate, { merge: true });

    // Créer notifications
    const notif1Ref = db.collection("notifications").doc();
    batch.set(notif1Ref, {
      recipientId: battle.player1Id,
      type: winner === battle.player1Id ? "battle_won" : "battle_lost",
      battleId: battleId,
      points: player1PointsAward,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
    });

    const notif2Ref = db.collection("notifications").doc();
    batch.set(notif2Ref, {
      recipientId: battle.player2Id,
      type: winner === battle.player2Id ? "battle_won" : "battle_lost",
      battleId: battleId,
      points: player2PointsAward,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
    });

    // Logger pour analytics
    const analyticsRef = db.collection("analytics_events").doc();
    batch.set(analyticsRef, {
      event: "battle_completed",
      battleId,
      winnerId: winner,
      player1Id: battle.player1Id,
      player2Id: battle.player2Id,
      player1Score: battle.player1Score,
      player2Score: battle.player2Score,
      type: battle.type,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 8. Commit atomique
    await batch.commit();

    return {
      success: true,
      winnerId: winner,
      player1Points: player1PointsAward,
      player2Points: player2PointsAward,
    };
  }
);

/**
 * Multiplicateur selon le type de battle
 */
function getTypeMultiplier(type: string): number {
  switch (type) {
    case "random":
      return 1.0;
    case "friend":
      return 1.2;
    case "revenge":
      return 1.5;
    case "championship":
      return 2.0;
    default:
      return 1.0;
  }
}

