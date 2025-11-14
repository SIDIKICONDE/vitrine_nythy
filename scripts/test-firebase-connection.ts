/**
 * Script de test pour vérifier la connexion Firebase
 * Usage: npx ts-node scripts/test-firebase-connection.ts
 */

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { join } from 'path';

async function testFirebaseConnection() {
  console.log('🚀 Test de connexion Firebase...\n');

  try {
    // Charger le fichier service account
    const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
    console.log('📁 Chargement du fichier:', serviceAccountPath);

    const serviceAccountData = readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountData);

    console.log('✅ Fichier service account chargé');
    console.log('   Project ID:', serviceAccount.project_id);
    console.log('   Client Email:', serviceAccount.client_email);
    console.log('');

    // Initialiser Firebase Admin
    if (getApps().length === 0) {
      initializeApp({
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
        }),
        storageBucket: `${serviceAccount.project_id}.firebasestorage.app`,
      });
      console.log('✅ Firebase Admin initialisé\n');
    }

    // Test Firestore
    console.log('🔍 Test Firestore...');
    const db = getFirestore();

    // Vérifier la collection merchants
    const merchantsSnapshot = await db.collection('merchants').limit(5).get();
    console.log(`✅ Collection 'merchants': ${merchantsSnapshot.size} documents trouvés`);

    if (merchantsSnapshot.size > 0) {
      const firstMerchant = merchantsSnapshot.docs[0];
      if (firstMerchant) {
        console.log(`   Premier merchant ID: ${firstMerchant.id}`);
        const data = firstMerchant.data();
        if (data['name']) {
          console.log(`   Nom: ${data['name']}`);
        }
      }
    }

    // Vérifier la collection products
    const productsSnapshot = await db.collection('products').limit(5).get();
    console.log(`✅ Collection 'products': ${productsSnapshot.size} documents trouvés`);

    // Vérifier la collection orders
    const ordersSnapshot = await db.collection('orders').limit(5).get();
    console.log(`✅ Collection 'orders': ${ordersSnapshot.size} documents trouvés`);

    // Vérifier la collection articles
    const articlesSnapshot = await db.collection('articles').limit(5).get();
    console.log(`✅ Collection 'articles': ${articlesSnapshot.size} documents trouvés`);

    console.log('');

    // Test Storage
    console.log('🔍 Test Storage...');
    const storage = getStorage();
    const bucket = storage.bucket();
    console.log(`✅ Storage bucket: ${bucket.name}`);

    // Lister quelques fichiers
    try {
      const [files] = await bucket.getFiles({ maxResults: 5 });
      console.log(`✅ Fichiers dans le bucket: ${files.length} fichiers trouvés`);
      if (files.length > 0) {
        files.forEach((file, index) => {
          console.log(`   ${index + 1}. ${file.name}`);
        });
      }
    } catch (storageError: any) {
      console.log('⚠️  Erreur lors de la liste des fichiers:', storageError.message);
    }

    console.log('\n✅ Test de connexion Firebase réussi !');
    console.log('✅ Le backend Firebase est correctement connecté à l\'application vitrine nyth\n');

    // Résumé
    console.log('📊 Résumé:');
    console.log(`   - Project ID: ${serviceAccount.project_id}`);
    console.log(`   - Merchants: ${merchantsSnapshot.size} documents`);
    console.log(`   - Products: ${productsSnapshot.size} documents`);
    console.log(`   - Orders: ${ordersSnapshot.size} documents`);
    console.log(`   - Articles: ${articlesSnapshot.size} documents`);
    console.log(`   - Storage: Connecté`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors du test de connexion:');
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le test
testFirebaseConnection();

