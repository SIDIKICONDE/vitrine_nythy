/**
 * Script de migration pour corriger les timestamps des marchands
 * Convertit les timestamps en format ISO string vers Timestamp Firestore
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();

async function fixMerchantTimestamps() {
  console.log('🔧 Démarrage de la migration des timestamps...\n');

  try {
    // Récupérer tous les marchands
    const merchantsSnapshot = await db.collection('merchants').get();
    console.log(`📊 ${merchantsSnapshot.size} marchands à vérifier\n`);

    let fixedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const doc of merchantsSnapshot.docs) {
      const data = doc.data();
      const merchantId = doc.id;
      const merchantName = data.name || 'Sans nom';

      try {
        const updates = {};
        let needsUpdate = false;

        // Vérifier et corriger createdAt
        if (data.createdAt && typeof data.createdAt === 'string') {
          console.log(`🔄 ${merchantName} (${merchantId}): createdAt est une string`);
          updates.createdAt = admin.firestore.Timestamp.fromDate(new Date(data.createdAt));
          needsUpdate = true;
        }

        // Vérifier et corriger updatedAt
        if (data.updatedAt && typeof data.updatedAt === 'string') {
          console.log(`🔄 ${merchantName} (${merchantId}): updatedAt est une string`);
          updates.updatedAt = admin.firestore.Timestamp.fromDate(new Date(data.updatedAt));
          needsUpdate = true;
        }

        // Vérifier et corriger termsAcceptedAt
        if (data.termsAcceptedAt && typeof data.termsAcceptedAt === 'string') {
          console.log(`🔄 ${merchantName} (${merchantId}): termsAcceptedAt est une string`);
          updates.termsAcceptedAt = admin.firestore.Timestamp.fromDate(new Date(data.termsAcceptedAt));
          needsUpdate = true;
        }

        // Vérifier stats.lastUpdated
        if (data.stats?.lastUpdated && typeof data.stats.lastUpdated === 'string') {
          console.log(`🔄 ${merchantName} (${merchantId}): stats.lastUpdated est une string`);
          updates['stats.lastUpdated'] = admin.firestore.Timestamp.fromDate(new Date(data.stats.lastUpdated));
          needsUpdate = true;
        }

        if (needsUpdate) {
          await doc.ref.update(updates);
          console.log(`✅ ${merchantName} (${merchantId}): corrigé\n`);
          fixedCount++;
        } else {
          console.log(`✓ ${merchantName} (${merchantId}): OK (déjà en Timestamp)\n`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Erreur pour ${merchantName} (${merchantId}):`, error.message);
        errorCount++;
      }
    }

    console.log('\n📊 Résumé de la migration:');
    console.log(`   ✅ Corrigés: ${fixedCount}`);
    console.log(`   ✓ Déjà OK: ${skippedCount}`);
    console.log(`   ❌ Erreurs: ${errorCount}`);
    console.log(`   📊 Total: ${merchantsSnapshot.size}`);

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Exécuter la migration
fixMerchantTimestamps();

