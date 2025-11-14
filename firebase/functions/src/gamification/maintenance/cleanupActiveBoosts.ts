import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";

export const cleanupActiveBoosts = onSchedule(
  {
    schedule: "every 1 hours",
    region: "europe-west1",
    timeZone: "Europe/Paris",
  },
  async () => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    const snapshot = await db.collection("player_stats").get();
    let batch = db.batch();
    let operations = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const activeBoosts = data.activeBoosts as Record<string, any> | undefined;
      if (!activeBoosts) {
        continue;
      }

      const updates: Record<string, any> = {};
      for (const [boostId, boostData] of Object.entries(activeBoosts)) {
        const expiresAt = extractTimestamp(boostData?.expiresAt);
        if (expiresAt && expiresAt.toMillis() <= now.toMillis()) {
          updates[`activeBoosts.${boostId}`] = admin.firestore.FieldValue.delete();
        }
      }

      const hasUpdates = Object.keys(updates).length > 0;
      if (!hasUpdates) {
        continue;
      }

      batch.update(doc.ref, updates);
      operations += 1;

      if (operations >= 400) {
        await batch.commit();
        batch = db.batch();
        operations = 0;
      }
    }

    if (operations > 0) {
      await batch.commit();
    }
  },
);

function extractTimestamp(value: unknown): admin.firestore.Timestamp | null {
  if (!value) {
    return null;
  }

  if (value instanceof admin.firestore.Timestamp) {
    return value;
  }

  if (typeof value === "string") {
    return admin.firestore.Timestamp.fromDate(new Date(value));
  }

  if (typeof value === "object" && value !== null) {
    const millis = (value as { seconds?: number; _seconds?: number; nanoseconds?: number }).seconds ??
      (value as { _seconds?: number })._seconds;
    if (millis != null) {
      return new admin.firestore.Timestamp(
        millis,
        (value as { nanoseconds?: number }).nanoseconds ?? 0,
      );
    }
  }

  return null;
}

