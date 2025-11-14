import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { validateAuthenticatedUser } from "../../middleware/auth.middleware";

interface CreateBattleRequest {
  player2Id: string;
  type: "random" | "friend" | "revenge" | "championship";
}

interface BattleObjective {
  id: string;
  description: string;
  targetValue: number;
  pointsReward: number;
  type: string;
  player1CurrentValue: number;
  player2CurrentValue: number;
}

/**
 * Cloud Function sécurisée pour créer une battle
 * 
 * Validations :
 * - Utilisateur authentifié
 * - Maximum 3 battles actives
 * - Player2 existe et n'est pas banni
 * - Génère des objectifs aléatoires
 */
export const createBattle = onCall(
  async (request) => {
    const data = request.data as CreateBattleRequest;
    const context = request.auth;

    // 1. Vérifier l'authentification avec rate limiting
    if (!validateAuthenticatedUser(context, "createBattle")) {
      throw new HttpsError(
        "unauthenticated",
        "L'utilisateur doit être authentifié"
      );
    }

    // Type guard : après validateAuthenticatedUser, context est garanti non-undefined
    if (!context) {
      throw new HttpsError(
        "unauthenticated",
        "L'utilisateur doit être authentifié"
      );
    }

    const player1Id = context.uid;
    const { player2Id, type } = data;

    // 2. Vérifier que player1 != player2
    if (player1Id === player2Id) {
      throw new HttpsError(
        "invalid-argument",
        "Impossible de se défier soi-même"
      );
    }

    const db = admin.firestore();

    // 3. Vérifier le nombre de battles actives du player1
    const activeBattlesSnapshot = await db.collection("battles")
      .where("player1Id", "==", player1Id)
      .where("status", "in", ["pending", "active"])
      .get();

    const activeBattlesAsPlayer2 = await db.collection("battles")
      .where("player2Id", "==", player1Id)
      .where("status", "in", ["pending", "active"])
      .get();

    const totalActiveBattles = activeBattlesSnapshot.size +
      activeBattlesAsPlayer2.size;

    if (totalActiveBattles >= 3) {
      throw new HttpsError(
        "resource-exhausted",
        "Maximum de 3 battles actives atteint"
      );
    }

    // 4. Récupérer les infos des joueurs
    const [player1Doc, player2Doc] = await Promise.all([
      db.collection("profiles").doc(player1Id).get(),
      db.collection("profiles").doc(player2Id).get(),
    ]);

    if (!player2Doc.exists) {
      throw new HttpsError(
        "not-found",
        "Le joueur invité n'existe pas"
      );
    }

    const player1Data = player1Doc.data();
    const player2Data = player2Doc.data();

    // 5. Générer des objectifs aléatoires
    const objectives = generateRandomObjectives(type);

    // 6. Calculer les timestamps
    const now = admin.firestore.Timestamp.now();
    const durationHours = getDurationForType(type);
    const endTime = new Date(now.toMillis() + durationHours * 60 * 60 * 1000);

    // 7. Créer la battle
    const battleRef = db.collection("battles").doc();
    const battleData = {
      id: battleRef.id,
      player1Id,
      player2Id,
      player1Name: player1Data?.displayName || "Joueur 1",
      player2Name: player2Data?.displayName || "Joueur 2",
      player1AvatarUrl: player1Data?.photoURL || null,
      player2AvatarUrl: player2Data?.photoURL || null,
      type,
      status: "pending",
      player1Score: 0,
      player2Score: 0,
      objectives,
      winnerId: null,
      createdAt: now,
      startTime: now,
      endTime: admin.firestore.Timestamp.fromDate(endTime),
      finishedAt: null,
    };

    await battleRef.set(battleData);

    // 8. Logger pour analytics
    await db.collection("analytics_events").add({
      event: "battle_created",
      player1Id,
      player2Id,
      type,
      timestamp: now,
    });

    return {
      success: true,
      battleId: battleRef.id,
      battle: battleData,
    };
  }
);

/**
 * Génère des objectifs aléatoires selon le type de battle
 */
function generateRandomObjectives(
  type: string
): BattleObjective[] {
  const objectives: BattleObjective[] = [];

  // Objectif 1 : Nombre de paniers achetés
  objectives.push({
    id: "baskets_" + Date.now(),
    description: "Acheter des paniers anti-gaspi",
    targetValue: type === "championship" ? 10 : 5,
    pointsReward: 200,
    type: "baskets",
    player1CurrentValue: 0,
    player2CurrentValue: 0,
  });

  // Objectif 2 : Économies réalisées
  objectives.push({
    id: "savings_" + Date.now(),
    description: "Économiser de l'argent",
    targetValue: type === "championship" ? 100 : 50,
    pointsReward: 150,
    type: "savings",
    player1CurrentValue: 0,
    player2CurrentValue: 0,
  });

  return objectives;
}

/**
 * Retourne la durée en heures selon le type
 */
function getDurationForType(type: string): number {
  switch (type) {
    case "random":
      return 24;
    case "friend":
      return 48;
    case "revenge":
      return 24;
    case "championship":
      return 72;
    default:
      return 24;
  }
}

