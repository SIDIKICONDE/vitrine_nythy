#!/usr/bin/env ts-node
/**
 * Script de diagnostic pour la clé privée Firebase
 * Usage: npx ts-node scripts/diagnose-firebase-key.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

function diagnoseFirebaseKey() {
  console.log('🔍 Diagnostic de la clé privée Firebase\n');
  console.log('=' .repeat(60));
  console.log('');

  // Vérifier les variables d'environnement
  const privateKey = process.env['FIREBASE_PRIVATE_KEY'];
  const clientEmail = process.env['FIREBASE_CLIENT_EMAIL'];
  const projectId = process.env['FIREBASE_PROJECT_ID'];

  console.log('📋 Variables d\'environnement:');
  console.log(`   FIREBASE_PROJECT_ID: ${projectId ? '✅ Défini' : '❌ Non défini'}`);
  console.log(`   FIREBASE_CLIENT_EMAIL: ${clientEmail ? '✅ Défini' : '❌ Non défini'}`);
  console.log(`   FIREBASE_PRIVATE_KEY: ${privateKey ? '✅ Défini' : '❌ Non défini'}`);
  console.log('');

  if (!privateKey) {
    console.log('❌ FIREBASE_PRIVATE_KEY n\'est pas défini');
    console.log('   Vérifiez votre fichier .env.production');
    return;
  }

  // Analyser la clé privée
  console.log('🔑 Analyse de la clé privée:');
  console.log(`   Longueur: ${privateKey.length} caractères`);
  console.log(`   Commence par ": ${privateKey.startsWith('"') ? 'Oui' : 'Non'}`);
  console.log(`   Se termine par ": ${privateKey.endsWith('"') ? 'Oui' : 'Non'}`);
  console.log(`   Contient \\n: ${privateKey.includes('\\n') ? 'Oui' : 'Non'}`);
  console.log(`   Contient de vrais retours à la ligne: ${privateKey.includes('\n') ? 'Oui' : 'Non'}`);
  console.log(`   Contient BEGIN PRIVATE KEY: ${privateKey.includes('BEGIN PRIVATE KEY') ? 'Oui' : 'Non'}`);
  console.log(`   Contient END PRIVATE KEY: ${privateKey.includes('END PRIVATE KEY') ? 'Oui' : 'Non'}`);
  console.log('');

  // Nettoyer la clé (même logique que dans firebase-admin.ts)
  let cleanedPrivateKey = privateKey.trim();
  
  // Enlever les guillemets
  cleanedPrivateKey = cleanedPrivateKey.replace(/^["']|["']$/g, '');
  
  // Remplacer les séquences d'échappement
  cleanedPrivateKey = cleanedPrivateKey.replace(/\\n/g, '\n');
  cleanedPrivateKey = cleanedPrivateKey.replace(/\\\\n/g, '\n');
  cleanedPrivateKey = cleanedPrivateKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  console.log('🧹 Après nettoyage:');
  console.log(`   Longueur: ${cleanedPrivateKey.length} caractères`);
  console.log(`   Contient de vrais retours à la ligne: ${cleanedPrivateKey.includes('\n') ? 'Oui' : 'Non'}`);
  console.log(`   Nombre de lignes: ${cleanedPrivateKey.split('\n').length}`);
  console.log(`   Commence par BEGIN: ${cleanedPrivateKey.startsWith('-----BEGIN PRIVATE KEY-----') ? 'Oui' : 'Non'}`);
  console.log(`   Se termine par END: ${cleanedPrivateKey.endsWith('-----END PRIVATE KEY-----') ? 'Oui' : 'Non'}`);
  console.log('');

  // Afficher un aperçu
  const lines = cleanedPrivateKey.split('\n');
  console.log('📄 Aperçu de la clé nettoyée (premières et dernières lignes):');
  console.log('   ' + lines.slice(0, 3).join('\n   '));
  console.log('   ...');
  console.log('   ' + lines.slice(-3).join('\n   '));
  console.log('');

  // Vérifier le format PEM
  const isValidPEM = cleanedPrivateKey.startsWith('-----BEGIN PRIVATE KEY-----') &&
                      cleanedPrivateKey.endsWith('-----END PRIVATE KEY-----') &&
                      cleanedPrivateKey.includes('\n');

  if (isValidPEM) {
    console.log('✅ Format PEM valide détecté');
    
    // Essayer de valider avec crypto (si disponible)
    try {
      const crypto = require('crypto');
      // Extraire juste le corps de la clé (sans les en-têtes)
      const keyBody = cleanedPrivateKey
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\n/g, '')
        .trim();
      
      // Essayer de créer une clé depuis le PEM
      const keyBuffer = Buffer.from(keyBody, 'base64');
      console.log(`   Corps de la clé (base64): ${keyBody.substring(0, 50)}...`);
      console.log(`   Taille du buffer: ${keyBuffer.length} bytes`);
      
      // Essayer de parser la clé
      try {
        crypto.createPrivateKey(cleanedPrivateKey);
        console.log('✅ La clé peut être parsée par Node.js crypto');
      } catch (parseError: any) {
        console.log(`❌ Erreur lors du parsing: ${parseError.message}`);
      }
    } catch (cryptoError: any) {
      console.log(`⚠️  Impossible de valider avec crypto: ${cryptoError.message}`);
    }
  } else {
    console.log('❌ Format PEM invalide');
    console.log('');
    console.log('💡 Recommandations:');
    if (!cleanedPrivateKey.includes('BEGIN PRIVATE KEY')) {
      console.log('   - La clé doit contenir -----BEGIN PRIVATE KEY-----');
    }
    if (!cleanedPrivateKey.includes('END PRIVATE KEY')) {
      console.log('   - La clé doit contenir -----END PRIVATE KEY-----');
    }
    if (!cleanedPrivateKey.includes('\n')) {
      console.log('   - La clé doit contenir des retours à la ligne (\\n dans .env)');
    }
  }

  console.log('');
  console.log('=' .repeat(60));
  console.log('');
  console.log('💡 Format attendu dans .env.production:');
  console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n');
  console.log('MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...');
  console.log('...');
  console.log('-----END PRIVATE KEY-----\\n"');
  console.log('');
}

// Exécuter le diagnostic
diagnoseFirebaseKey();

