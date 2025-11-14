/**
 * Nettoyer les documents users orphelins (sans compte Auth)
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function cleanOrphanUsers() {
  console.log('🧹 Nettoyage des utilisateurs orphelins...\n');

  // Récupérer tous les utilisateurs Firebase Auth
  const authUsersResult = await auth.listUsers();
  const authUserIds = new Set(authUsersResult.users.map(u => u.uid));
  
  console.log(`🔐 ${authUserIds.size} utilisateurs dans Firebase Auth`);

  // Récupérer tous les documents Firestore
  const usersSnapshot = await db.collection('users').get();
  console.log(`📦 ${usersSnapshot.size} documents dans Firestore users\n`);

  let deleted = 0;
  let kept = 0;

  for (const doc of usersSnapshot.docs) {
    const userId = doc.id;
    const data = doc.data();
    const email = data.email || data.displayName || 'Sans infos';

    if (authUserIds.has(userId)) {
      console.log(`✅ Garde: ${email} (${userId})`);
      kept++;
    } else {
      console.log(`❌ Supprime: ${email} (${userId}) - Orphelin`);
      await doc.ref.delete();
      deleted++;
    }
  }

  console.log(`\n📊 Résumé:`);
  console.log(`   ✅ Gardés: ${kept}`);
  console.log(`   ❌ Supprimés: ${deleted}`);
  console.log(`   📦 Total: ${usersSnapshot.size}`);

  process.exit(0);
}

cleanOrphanUsers();

