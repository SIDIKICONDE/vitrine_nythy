const { onCall } = require('firebase-functions/v2/https');
const { HttpsError } = require('firebase-functions/https');
const { onDocumentWritten } = require('firebase-functions/v2/firestore');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');

/**
 * Met à jour les statistiques d'un challenge lorsqu'un utilisateur le termine
 */
exports.updateChallengeStats = onDocumentWritten('user_challenges/{userChallengeId}', async (event) => {
  const userChallengeId = event.params.userChallengeId;
  const before = event.data.before ? event.data.before.data() : null;
  const after = event.data.after ? event.data.after.data() : null;

  // Vérifier si le challenge a été terminé
  if (before && after &&
    before.status !== 'completed' &&
    after.status === 'completed') {

    const challengeId = after.challengeId;
    const challengeRef = admin.firestore().collection('challenges').doc(challengeId);

    // Mettre à jour les statistiques du challenge
    await challengeRef.update({
      completionCount: admin.firestore.FieldValue.increment(1),
      totalAttempts: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Recalculer le taux de réussite
    const challengeDoc = await challengeRef.get();
    const challengeData = challengeDoc.data();

    if (challengeData.totalAttempts > 0) {
      const successRate = challengeData.completionCount / challengeData.totalAttempts;
      await challengeRef.update({
        successRate: successRate
      });
    }

    // Mettre à jour les statistiques utilisateur
    const userId = after.userId;
    const userRef = admin.firestore().collection('users').doc(userId);

    await userRef.update({
      loyaltyPoints: admin.firestore.FieldValue.increment(after.pointsEarned || 0),
      experiencePoints: admin.firestore.FieldValue.increment(after.experiencePointsEarned || 0),
      lastActivityDate: admin.firestore.FieldValue.serverTimestamp()
    });

    // Ajouter le badge si spécifié
    if (after.rewardClaimed && challengeData.reward && challengeData.reward.badgeId) {
      const badgeId = challengeData.reward.badgeId;
      const userDoc = await userRef.get();
      const userData = userDoc.data();
      const earnedBadges = userData.earnedBadges || [];

      // Vérifier si l'utilisateur n'a pas déjà ce badge
      const hasBadge = earnedBadges.some(badge =>
        badge.badge.id === badgeId
      );

      if (!hasBadge) {
        const newBadge = {
          badge: {
            id: badgeId,
            name: challengeData.reward.title || 'Nouveau Badge',
            description: challengeData.reward.description || 'Badge gagné'
          },
          level: 'bronze',
          earnedAt: admin.firestore.FieldValue.serverTimestamp(),
          progress: 0
        };

        await userRef.update({
          earnedBadges: admin.firestore.FieldValue.arrayUnion([newBadge])
        });
      }
    }
  }
});

/**
 * Réinitialise automatiquement les challenges récurrents
 */
exports.resetRecurringChallenges = onSchedule({
  schedule: '0 0 * * *', // Tous les jours à minuit
  timeZone: 'Europe/Paris'
}, async (event) => {
  const challengesRef = admin.firestore().collection('challenges');
  const now = new Date();

  // Récupérer tous les challenges actifs
  const challengesSnapshot = await challengesRef
    .where('isActive', '==', true)
    .get();

  const batch = admin.firestore().batch();
  let resetCount = 0;

  for (const challengeDoc of challengesSnapshot.docs) {
    const challengeData = challengeDoc.data();
    const lastResetDate = challengeData.lastResetDate?.toDate();
    const frequency = challengeData.frequency;

    let shouldReset = false;

    // Déterminer si le challenge doit être réinitialisé
    if (lastResetDate) {
      const daysSinceReset = Math.floor((now - lastResetDate) / (1000 * 60 * 60 * 24));

      switch (frequency) {
        case 'daily':
          shouldReset = daysSinceReset >= 1;
          break;
        case 'weekly':
          shouldReset = daysSinceReset >= 7;
          break;
        case 'monthly':
          shouldReset = daysSinceReset >= 30;
          break;
      }
    } else {
      // Premier reset
      shouldReset = true;
    }

    if (shouldReset) {
      batch.update(challengeDoc.ref, {
        lastResetDate: admin.firestore.FieldValue.serverTimestamp(),
        participantIds: [],
        completionCount: 0,
        totalAttempts: 0,
        successRate: 0.0,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      resetCount++;
    }
  }

  if (resetCount > 0) {
    await batch.commit();
    console.log(`Réinitialisé ${resetCount} challenges récurrents`);
  }

  return null;
});

/**
 * Met à jour les statistiques globales des challenges
 */
exports.updateGlobalChallengeStats = onDocumentWritten('challenges/{challengeId}', async (event) => {
  const challengeId = event.params.challengeId;
  const before = event.data.before ? event.data.before.data() : null;
  const after = event.data.after ? event.data.after.data() : null;

  // Vérifier si les statistiques ont changé
  if (before && after &&
    (before.completionCount !== after.completionCount ||
      before.totalAttempts !== after.totalAttempts ||
      before.participantIds.length !== after.participantIds.length)) {

    // Recalculer les statistiques globales
    const challengesSnapshot = await admin.firestore()
      .collection('challenges')
      .where('isActive', '==', true)
      .get();

    let totalChallenges = 0;
    let totalParticipants = 0;
    let totalCompletions = 0;
    let totalAttempts = 0;
    let averageSuccessRate = 0;

    challengesSnapshot.forEach(doc => {
      const data = doc.data();
      totalChallenges++;
      totalParticipants += data.participantIds?.length || 0;
      totalCompletions += data.completionCount || 0;
      totalAttempts += data.totalAttempts || 0;
      averageSuccessRate += data.successRate || 0;
    });

    if (totalChallenges > 0) {
      averageSuccessRate = averageSuccessRate / totalChallenges;
    }

    // Mettre à jour les statistiques globales
    await admin.firestore().collection('stats').doc('challenges').set({
      totalChallenges,
      totalParticipants,
      totalCompletions,
      totalAttempts,
      averageSuccessRate,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
});

/**
 * Met à jour les statistiques d'un utilisateur lorsqu'il participe à un challenge
 */
exports.updateUserChallengeStats = onDocumentWritten('user_challenges/{userChallengeId}', async (event) => {
  const userChallengeId = event.params.userChallengeId;
  const before = event.data.before ? event.data.before.data() : null;
  const after = event.data.after ? event.data.after.data() : null;

  if (after) {
    const userId = after.userId;
    const userRef = admin.firestore().collection('users').doc(userId);

    // Récupérer les statistiques actuelles de l'utilisateur
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    // Calculer les nouvelles statistiques
    const userChallengesSnapshot = await admin.firestore()
      .collection('user_challenges')
      .where('userId', '==', userId)
      .get();

    let activeChallenges = 0;
    let completedChallenges = 0;
    let totalPointsEarned = 0;
    let totalExperienceEarned = 0;
    let totalPerformanceScore = 0;
    let performanceCount = 0;

    userChallengesSnapshot.forEach(doc => {
      const data = doc.data();

      if (data.status === 'in_progress' || data.status === 'not_started') {
        activeChallenges++;
      } else if (data.status === 'completed') {
        completedChallenges++;
      }

      totalPointsEarned += data.pointsEarned || 0;
      totalExperienceEarned += data.experiencePointsEarned || 0;

      // Calculer le score de performance
      if (data.attemptsCount > 0) {
        const successRate = (data.attemptsCount - (data.failuresCount || 0)) / data.attemptsCount;
        const timeBonus = data.bestCompletionTimeMinutes ?
          Math.max(0, 1 - (data.bestCompletionTimeMinutes / 100)) : 0;
        const performanceScore = (successRate * 0.7 + timeBonus * 0.3) * 100;
        totalPerformanceScore += performanceScore;
        performanceCount++;
      }
    });

    const averagePerformance = performanceCount > 0 ?
      totalPerformanceScore / performanceCount : 0;

    // Mettre à jour les statistiques utilisateur
    await userRef.update({
      activeChallenges,
      completedChallenges,
      totalPointsEarned,
      totalExperienceEarned,
      averagePerformance,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
});

/**
 * Met à jour le classement d'un challenge communautaire
 */
exports.updateCommunityChallengeLeaderboard = onDocumentWritten('user_challenges/{userChallengeId}', async (event) => {
  const userChallengeId = event.params.userChallengeId;
  const after = event.data.after ? event.data.after.data() : null;

  if (after && after.status === 'completed') {
    const challengeId = after.challengeId;
    const challengeRef = admin.firestore().collection('challenges').doc(challengeId);

    // Vérifier si c'est un challenge communautaire
    const challengeDoc = await challengeRef.get();
    const challengeData = challengeDoc.data();

    if (challengeData.type === 'community') {
      // Récupérer tous les participants terminés
      const completedParticipantsSnapshot = await admin.firestore()
        .collection('user_challenges')
        .where('challengeId', '==', challengeId)
        .where('status', '==', 'completed')
        .orderBy('completedAt')
        .limit(100)
        .get();

      const leaderboard = [];

      for (const doc of completedParticipantsSnapshot.docs) {
        const userChallengeData = doc.data();
        const userDoc = await admin.firestore()
          .collection('users')
          .doc(userChallengeData.userId)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          leaderboard.push({
            userId: userChallengeData.userId,
            userName: userData.displayName || 'Utilisateur anonyme',
            userPhoto: userData.photoUrl,
            completedAt: userChallengeData.completedAt,
            pointsEarned: userChallengeData.pointsEarned || 0,
            performanceScore: userChallengeData.performanceScore || 0
          });
        }
      }

      // Mettre à jour le classement
      await challengeRef.update({
        leaderboard,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
});

/**
 * Nettoie les challenges expirés
 */
exports.cleanupExpiredChallenges = onSchedule({
  schedule: '0 2 * * *', // Tous les jours à 2h du matin
  timeZone: 'Europe/Paris'
}, async (event) => {
  const challengesRef = admin.firestore().collection('challenges');
  const now = new Date();

  // Récupérer les challenges expirés
  const expiredChallengesSnapshot = await challengesRef
    .where('isActive', '==', true)
    .where('endDate', '<', now)
    .get();

  const batch = admin.firestore().batch();
  let cleanupCount = 0;

  for (const challengeDoc of expiredChallengesSnapshot.docs) {
    batch.update(challengeDoc.ref, {
      status: 'expired',
      isActive: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    cleanupCount++;
  }

  if (cleanupCount > 0) {
    await batch.commit();
    console.log(`Nettoyé ${cleanupCount} challenges expirés`);
  }

  return null;
});

/**
 * Génère des challenges recommandés pour un utilisateur
 */
exports.generateRecommendedChallenges = onCall(async (request) => {
  // Vérifier l'authentification
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'L\'utilisateur doit être authentifié'
    );
  }

  const userId = request.auth.uid;
  const data = request.data;
  const userRef = admin.firestore().collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    throw new HttpsError(
      'not-found',
      'Utilisateur non trouvé'
    );
  }

  const userData = userDoc.data();
  const userLevel = userData.userLevel || 1;
  const userBadges = userData.earnedBadges || [];
  const userStats = {
    productsSaved: userData.productsSaved || 0,
    co2SavedKg: userData.co2SavedKg || 0,
    moneySavedEuros: userData.moneySavedEuros || 0
  };

  // Récupérer les challenges actifs
  const challengesSnapshot = await admin.firestore()
    .collection('challenges')
    .where('isActive', '==', true)
    .where('status', '==', 'active')
    .get();

  const recommendedChallenges = [];

  for (const challengeDoc of challengesSnapshot.docs) {
    const challengeData = challengeDoc.data();

    // Vérifier les prérequis
    let isRecommended = true;

    // Vérifier le niveau minimum
    if (challengeData.metadata?.minLevel && userLevel < challengeData.metadata.minLevel) {
      isRecommended = false;
    }

    // Vérifier les badges requis
    if (challengeData.metadata?.requiredBadges) {
      const requiredBadges = challengeData.metadata.requiredBadges;
      for (const requiredBadge of requiredBadges) {
        const hasBadge = userBadges.some(badge =>
          badge.badge.id.startsWith(requiredBadge)
        );
        if (!hasBadge) {
          isRecommended = false;
          break;
        }
      }
    }

    // Vérifier les statistiques requises
    if (challengeData.metadata?.minStats) {
      const minStats = challengeData.metadata.minStats;
      if (minStats.productsSaved && userStats.productsSaved < minStats.productsSaved) {
        isRecommended = false;
      }
      if (minStats.co2SavedKg && userStats.co2SavedKg < minStats.co2SavedKg) {
        isRecommended = false;
      }
    }

    if (isRecommended) {
      recommendedChallenges.push({
        id: challengeDoc.id,
        ...challengeData
      });
    }
  }

  // Limiter à 10 recommandations
  return recommendedChallenges.slice(0, 10);
});
