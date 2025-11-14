import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { validateAuthenticatedUser } from "../../middleware/auth.middleware";

interface ClaimRewardRequest {
  rewardId: string;
}

type RewardType = "points" | "gems" | "badge" | "boost" | "cosmetic" | "title";

export const claimReward = onCall(async (request) => {
  const data = request.data as ClaimRewardRequest;
  const context = request.auth;

  if (!context || !validateAuthenticatedUser(context, "claimReward")) {
    throw new HttpsError("unauthenticated", "L'utilisateur doit être authentifié");
  }

  const { rewardId } = data;
  const userId = context.uid;
  const db = admin.firestore();

  const rewardRef = db.collection("player_rewards").doc(rewardId);
  const rewardDoc = await rewardRef.get();

  if (!rewardDoc.exists) {
    throw new HttpsError("not-found", "Récompense introuvable");
  }

  const rewardData = rewardDoc.data()!;

  if (rewardData.playerId !== userId) {
    throw new HttpsError(
      "permission-denied",
      "Cette récompense n'appartient pas à l'utilisateur",
    );
  }

  if (rewardData.claimed) {
    throw new HttpsError("failed-precondition", "Récompense déjà réclamée");
  }

  const prize = rewardData.prize as Record<string, unknown> | undefined;
  if (!prize) {
    throw new HttpsError("invalid-argument", "Données de récompense invalides");
  }

  const batch = db.batch();
  const statsRef = db.collection("player_stats").doc(userId);
  const lastRewardAt = admin.firestore.FieldValue.serverTimestamp();

  batch.update(rewardRef, {
    claimed: true,
    claimedAt: lastRewardAt,
  });

  const rewardType = String(prize.type ?? "points") as RewardType;
  const updates: admin.firestore.UpdateData<any> = {
    lastRewardAt,
  };

  switch (rewardType) {
    case "points": {
      const value = Number(prize.value ?? 0);
      updates.totalPoints = admin.firestore.FieldValue.increment(value);
      break;
    }
    case "gems": {
      const value = Number(prize.value ?? 0);
      updates.totalGems = admin.firestore.FieldValue.increment(value);
      break;
    }
    case "badge": {
      const badgeId = String(prize.id ?? prize.name ?? rewardId);
      updates.earnedBadges = admin.firestore.FieldValue.arrayUnion(badgeId);
      break;
    }
    case "boost": {
      const boostId = String(prize.id ?? rewardId);
      const boostName = String(prize.name ?? boostId);
      const expiresAt = resolveBoostExpiration(prize);

      updates[`activeBoosts.${boostId}`] = {
        id: boostId,
        name: boostName,
        source: String(prize.source ?? "reward"),
        activatedAt: lastRewardAt,
        expiresAt,
      };
      break;
    }
    default: {
      // Autres types : consigner pour analytics
      updates[`metadata.lastRewardType`] = rewardType;
      break;
    }
  }

  batch.set(statsRef, updates, { merge: true });

  await batch.commit();

  return {
    success: true,
  };
});

function resolveBoostExpiration(prize: Record<string, unknown>): admin.firestore.Timestamp {
  const now = admin.firestore.Timestamp.now();
  const durationHours = Number(prize.durationHours ?? prize.value ?? 24);
  const explicitExpires = prize.expiresAt;

  if (explicitExpires instanceof admin.firestore.Timestamp) {
    return explicitExpires;
  }

  if (typeof explicitExpires === "string") {
    return admin.firestore.Timestamp.fromDate(new Date(explicitExpires));
  }

  const date = new Date(now.toMillis() + durationHours * 60 * 60 * 1000);
  return admin.firestore.Timestamp.fromDate(date);
}

