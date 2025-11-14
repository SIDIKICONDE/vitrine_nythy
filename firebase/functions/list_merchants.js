const admin = require('firebase-admin');

admin.initializeApp();

async function listMerchants() {
  try {
    const snapshot = await admin.firestore().collection('merchants').limit(10).get();
    
    console.log(`\n📋 ${snapshot.size} marchand(s) trouvé(s):\n`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`  Nom: ${data.name || 'N/A'}`);
      console.log(`  Adresse: ${data.address || 'N/A'}`);
      
      if (data.location) {
        console.log(`  Location: ${data.location._latitude}, ${data.location._longitude}`);
      } else {
        console.log(`  Location: ❌ MANQUANTE`);
      }
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

listMerchants();
