import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Configuration Firebase Admin pour le serveur
 */

// Initialiser Firebase Admin (une seule fois)
if (getApps().length === 0) {
  try {
    const projectId = process.env['FIREBASE_PROJECT_ID'] || 'nythy-72973';
    const storageBucket = process.env['FIREBASE_STORAGE_BUCKET'] || 'nythy-72973.firebasestorage.app';
    
    // Essayer d'abord d'utiliser le fichier JSON de service account
    let serviceAccount: any = null;
    try {
      const serviceAccountPath = join(process.cwd(), 'firebase-service-account.json');
      const serviceAccountData = readFileSync(serviceAccountPath, 'utf8');
      serviceAccount = JSON.parse(serviceAccountData);
      console.log('✅ Fichier service account trouvé:', serviceAccountPath);
    } catch (fileError) {
      // Le fichier n'existe pas, on continue avec les variables d'environnement
      console.log('ℹ️  Fichier service account non trouvé, utilisation des variables d\'environnement');
    }
    
    if (serviceAccount) {
      // Utiliser le fichier JSON de service account
      initializeApp({
        credential: cert({
          projectId: serviceAccount.project_id,
          clientEmail: serviceAccount.client_email,
          privateKey: serviceAccount.private_key,
        }),
        storageBucket: process.env['FIREBASE_STORAGE_BUCKET'] || `${serviceAccount.project_id}.firebasestorage.app`,
      });
      console.log('✅ Firebase Admin initialisé avec fichier service account');
    } else {
      // Essayer d'utiliser les credentials depuis les variables d'environnement
      const privateKey = process.env['FIREBASE_PRIVATE_KEY'];
      const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
      
      if (privateKey && clientEmail && privateKey !== 'your-private-key-here') {
        // Nettoyer la clé privée de manière robuste
        let cleanedPrivateKey = privateKey.trim();
        
        // Enlever les guillemets au début/fin si présents
        if ((cleanedPrivateKey.startsWith('"') && cleanedPrivateKey.endsWith('"')) ||
            (cleanedPrivateKey.startsWith("'") && cleanedPrivateKey.endsWith("'"))) {
          cleanedPrivateKey = cleanedPrivateKey.slice(1, -1);
        }
        
        // Remplacer les séquences d'échappement \n par de vrais retours à la ligne
        cleanedPrivateKey = cleanedPrivateKey.replace(/\\n/g, '\n');
        
        // Si la clé ne contient pas de retours à la ligne mais contient des espaces,
        // essayer de la reformater (cas où la clé est sur une seule ligne)
        if (!cleanedPrivateKey.includes('\n') && cleanedPrivateKey.includes('BEGIN PRIVATE KEY')) {
          // La clé est probablement sur une seule ligne, essayer de la reformater
          // Format attendu: -----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
          cleanedPrivateKey = cleanedPrivateKey
            .replace(/-----BEGIN PRIVATE KEY-----/, '-----BEGIN PRIVATE KEY-----\n')
            .replace(/-----END PRIVATE KEY-----/, '\n-----END PRIVATE KEY-----')
            .replace(/\s+/g, '\n'); // Remplacer les espaces multiples par des retours à la ligne
        }
        
        // Vérifier que la clé est valide avant d'essayer de l'utiliser
        if (!cleanedPrivateKey.includes('BEGIN PRIVATE KEY') || !cleanedPrivateKey.includes('END PRIVATE KEY')) {
          throw new Error('FIREBASE_PRIVATE_KEY format invalide: doit contenir -----BEGIN PRIVATE KEY----- et -----END PRIVATE KEY-----');
        }
        
        // Utiliser les credentials explicites
        try {
          initializeApp({
            credential: cert({
              projectId,
              clientEmail: clientEmail.trim(),
              privateKey: cleanedPrivateKey,
            }),
            storageBucket,
          });
          console.log('✅ Firebase Admin initialisé avec credentials depuis variables d\'environnement');
        } catch (certError: any) {
          console.error('❌ Erreur lors de l\'initialisation avec cert:', certError.message);
          console.error('💡 Vérifiez que FIREBASE_PRIVATE_KEY est correctement formaté:');
          console.error('   - Doit contenir -----BEGIN PRIVATE KEY----- et -----END PRIVATE KEY-----');
          console.error('   - Les retours à la ligne doivent être représentés par \\n');
          console.error('   - Exemple: FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
          throw certError;
        }
      } else {
        // Essayer d'utiliser les credentials par défaut (Firebase CLI ou Google Cloud)
        try {
          initializeApp({
            credential: applicationDefault(),
            projectId,
            storageBucket,
          });
          console.log('✅ Firebase Admin initialisé avec credentials par défaut');
        } catch (defaultError) {
          console.error('❌ Erreur lors de l\'initialisation Firebase Admin:', defaultError);
          console.error('⚠️  Vérifiez que FIREBASE_PRIVATE_KEY et FIREBASE_CLIENT_EMAIL sont définis dans .env.local');
          throw new Error('Firebase Admin credentials manquantes. Vérifiez .env.local ou ajoutez firebase-service-account.json');
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur fatale lors de l\'initialisation Firebase Admin:', error);
    throw error;
  }
}

// Exporter les services Firebase Admin
export const adminDb = getFirestore();
export const adminStorage = getStorage();

