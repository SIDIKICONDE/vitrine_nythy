/**
 * Script d'initialisation des paramètres de parrainage
 * 
 * Ce script crée le document de configuration avec les valeurs par défaut
 * pour le système de parrainage.
 * 
 * Exécution:
 * node firebase/scripts/init_referral_settings.js
 */

const admin = require('firebase-admin');

// Initialiser Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
}

const db = admin.firestore();

async function initializeReferralSettings() {
  try {
    console.log('🎁 Initialisation des paramètres de parrainage...');

    // Vérifier si le document existe déjà
    const settingsRef = db.collection('config').doc('referralSettings');
    const doc = await settingsRef.get();

    if (doc.exists) {
      console.log('⚠️  Les paramètres existent déjà:');
      console.log('   - Récompense parrain:', doc.data().referrerReward, '€');
      console.log('   - Récompense filleul:', doc.data().refereeReward, '€');
      console.log('\n💡 Pour mettre à jour, utilisez le dashboard admin.');
      return;
    }

    // Créer le document avec les valeurs par défaut
    const defaultSettings = {
      referrerReward: 5.0,  // 5€ pour le parrain
      refereeReward: 2.0,   // 2€ pour le filleul
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      description: 'Paramètres du système de parrainage',
    };

    await settingsRef.set(defaultSettings);

    console.log('✅ Paramètres de parrainage initialisés avec succès!');
    console.log('   - Récompense parrain: 5.00 €');
    console.log('   - Récompense filleul: 2.00 €');
    console.log('\n📝 Ces valeurs peuvent être modifiées depuis le dashboard admin.');
    console.log('   Navigation: Admin > Dashboard > Section Parrainage > Configurer');

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    throw error;
  }
}

// Exécuter le script
initializeReferralSettings()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Échec du script:', error);
    process.exit(1);
  });

