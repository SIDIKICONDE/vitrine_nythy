/**
 * Script d'initialisation des FAQs dans Firestore
 * 
 * Exécution :
 * 1. cd firebase
 * 2. node scripts/init_faq.js
 * 
 * Prérequis :
 * - Firebase Admin SDK configuré
 * - Variables d'environnement ou service account configurés
 */

const admin = require('firebase-admin');

// Initialiser Firebase Admin (ajuster selon votre configuration)
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // Ou utilisez un service account :
    // credential: admin.credential.cert(require('./path-to-service-account.json'))
  });
} catch (error) {
  console.log('Firebase déjà initialisé ou erreur:', error.message);
}

const db = admin.firestore();

/**
 * FAQs à créer dans Firestore
 */
const faqs = [
  // ========================================
  // CATÉGORIE: GÉNÉRAL
  // ========================================
  {
    category: 'general',
    question: 'Qu\'est-ce que Nythy ?',
    answer: 'Nythy est une application qui vous permet de lutter contre le gaspillage alimentaire tout en réalisant des économies. Vous pouvez découvrir des paniers surprise de commerçants locaux à prix réduit et participer à des défis écologiques.',
    tags: ['nythy', 'application', 'présentation', 'gaspillage alimentaire'],
    order: 1,
    isPopular: true,
  },
  {
    category: 'general',
    question: 'Comment fonctionne Nythy ?',
    answer: 'Nythy connecte les commerçants qui ont des invendus avec des utilisateurs qui souhaitent les acheter à prix réduit. Vous parcourez les offres disponibles près de chez vous, réservez un panier, et vous le récupérez au moment indiqué. C\'est simple, économique et écologique !',
    tags: ['fonctionnement', 'comment ça marche', 'utilisation'],
    order: 2,
    isPopular: true,
  },
  {
    category: 'general',
    question: 'L\'application est-elle gratuite ?',
    answer: 'Oui ! Le téléchargement et l\'utilisation de Nythy sont entièrement gratuits. Vous ne payez que pour les paniers que vous réservez auprès des commerçants.',
    tags: ['gratuit', 'prix', 'coût', 'tarif'],
    order: 3,
    isPopular: true,
  },
  {
    category: 'general',
    question: 'Dans quelles villes Nythy est-elle disponible ?',
    answer: 'Nythy est actuellement disponible dans plusieurs grandes villes françaises et continue son expansion. Consultez la carte dans l\'application pour voir les commerçants disponibles près de chez vous.',
    tags: ['disponibilité', 'villes', 'localisation', 'zone'],
    order: 4,
    isPopular: false,
  },

  // ========================================
  // CATÉGORIE: COMPTE
  // ========================================
  {
    category: 'account',
    question: 'Comment créer un compte ?',
    answer: 'Pour créer un compte, téléchargez l\'application et cliquez sur "S\'inscrire". Vous pouvez vous inscrire avec votre adresse email, votre compte Google ou Apple. Suivez ensuite les instructions pour compléter votre profil.',
    tags: ['inscription', 'créer compte', 'nouveau compte'],
    order: 1,
    isPopular: true,
  },
  {
    category: 'account',
    question: 'J\'ai oublié mon mot de passe, que faire ?',
    answer: 'Sur la page de connexion, cliquez sur "Mot de passe oublié". Entrez votre adresse email et vous recevrez un lien pour réinitialiser votre mot de passe. Vérifiez aussi vos spams si vous ne le recevez pas.',
    tags: ['mot de passe', 'oublié', 'réinitialiser', 'récupération'],
    order: 2,
    isPopular: true,
  },
  {
    category: 'account',
    question: 'Comment modifier mes informations personnelles ?',
    answer: 'Allez dans votre Profil, puis cliquez sur "Paramètres". Vous pouvez y modifier votre nom, photo de profil, adresse email, et autres informations personnelles.',
    tags: ['modifier', 'profil', 'informations personnelles', 'éditer'],
    order: 3,
    isPopular: false,
  },
  {
    category: 'account',
    question: 'Comment supprimer mon compte ?',
    answer: 'Pour supprimer votre compte, allez dans Profil > Paramètres > Compte et sécurité > Supprimer mon compte. Attention : cette action est irréversible et supprimera toutes vos données.',
    tags: ['supprimer', 'compte', 'suppression', 'désactivation'],
    order: 4,
    isPopular: false,
  },

  // ========================================
  // CATÉGORIE: PAIEMENT
  // ========================================
  {
    category: 'payment',
    question: 'Quels moyens de paiement sont acceptés ?',
    answer: 'Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via notre système de paiement sécurisé Stripe. Certains commerçants peuvent aussi accepter le paiement en espèces sur place.',
    tags: ['paiement', 'moyens de paiement', 'carte bancaire', 'espèces'],
    order: 1,
    isPopular: true,
  },
  {
    category: 'payment',
    question: 'Mes données bancaires sont-elles sécurisées ?',
    answer: 'Oui, absolument ! Vos informations de paiement sont traitées par Stripe, une plateforme de paiement certifiée PCI-DSS niveau 1 (le plus haut niveau de sécurité). Nous ne stockons jamais vos données bancaires complètes.',
    tags: ['sécurité', 'données bancaires', 'protection', 'stripe'],
    order: 2,
    isPopular: true,
  },
  {
    category: 'payment',
    question: 'Puis-je me faire rembourser ?',
    answer: 'Les remboursements dépendent de la politique de chaque commerçant. En cas de problème avec votre commande, contactez d\'abord le commerçant. Si le problème persiste, notre équipe support peut intervenir pour trouver une solution.',
    tags: ['remboursement', 'annulation', 'retour'],
    order: 3,
    isPopular: true,
  },
  {
    category: 'payment',
    question: 'Comment obtenir une facture ?',
    answer: 'Après chaque achat, un reçu est automatiquement envoyé à votre adresse email. Vous pouvez aussi retrouver l\'historique de vos commandes dans la section "Mes commandes" de votre profil.',
    tags: ['facture', 'reçu', 'justificatif', 'historique'],
    order: 4,
    isPopular: false,
  },

  // ========================================
  // CATÉGORIE: COMMANDES
  // ========================================
  {
    category: 'orders',
    question: 'Comment réserver un panier surprise ?',
    answer: 'Parcourez les offres disponibles sur la carte ou dans la liste. Cliquez sur une offre qui vous intéresse, vérifiez les détails (horaire de retrait, prix, contenu approximatif), puis cliquez sur "Réserver". Payez et vous recevrez une confirmation.',
    tags: ['réserver', 'panier', 'commande', 'achat'],
    order: 1,
    isPopular: true,
  },
  {
    category: 'orders',
    question: 'Puis-je annuler ma réservation ?',
    answer: 'Vous pouvez annuler votre réservation jusqu\'à 2 heures avant l\'heure de retrait prévue. Allez dans "Mes commandes", sélectionnez la commande et cliquez sur "Annuler". Le remboursement sera effectué sous 3-5 jours ouvrés.',
    tags: ['annuler', 'réservation', 'annulation', 'retour'],
    order: 2,
    isPopular: true,
  },
  {
    category: 'orders',
    question: 'Comment récupérer mon panier ?',
    answer: 'Rendez-vous au commerce à l\'heure indiquée dans votre confirmation. Présentez votre code de réservation (disponible dans "Mes commandes") au commerçant. Il vous remettra votre panier surprise.',
    tags: ['récupérer', 'retrait', 'collecter', 'prendre'],
    order: 3,
    isPopular: true,
  },
  {
    category: 'orders',
    question: 'Que contient un panier surprise ?',
    answer: 'Le contenu exact d\'un panier surprise varie selon les invendus du jour. L\'application indique le type de produits (ex: boulangerie, fruits et légumes) et la valeur approximative. C\'est une surprise, mais toujours de qualité !',
    tags: ['contenu', 'panier', 'produits', 'surprise'],
    order: 4,
    isPopular: true,
  },
  {
    category: 'orders',
    question: 'Que faire si le commerce est fermé à mon arrivée ?',
    answer: 'Si le commerce est fermé à l\'heure prévue, prenez une photo et contactez immédiatement notre support via l\'application. Nous vous aiderons à résoudre le problème et examinerons les options de remboursement.',
    tags: ['problème', 'commerce fermé', 'retrait', 'support'],
    order: 5,
    isPopular: false,
  },

  // ========================================
  // CATÉGORIE: COMMERÇANTS
  // ========================================
  {
    category: 'merchants',
    question: 'Comment devenir commerçant partenaire ?',
    answer: 'Si vous êtes commerçant et souhaitez rejoindre Nythy, cliquez sur "Devenir partenaire" dans le menu. Remplissez le formulaire d\'inscription et notre équipe vous contactera pour finaliser votre inscription.',
    tags: ['commerçant', 'partenaire', 'inscription', 'rejoindre'],
    order: 1,
    isPopular: true,
  },
  {
    category: 'merchants',
    question: 'Quels sont les avantages pour les commerçants ?',
    answer: 'Nythy permet aux commerçants de réduire le gaspillage, générer un revenu supplémentaire sur leurs invendus, attirer de nouveaux clients et améliorer leur image écologique. Commission transparente et simple.',
    tags: ['avantages', 'commerçant', 'bénéfices'],
    order: 2,
    isPopular: false,
  },
  {
    category: 'merchants',
    question: 'Comment noter un commerçant ?',
    answer: 'Après avoir récupéré votre panier, vous recevrez une notification vous invitant à évaluer votre expérience. Vous pouvez donner une note de 1 à 5 étoiles et laisser un commentaire pour aider les autres utilisateurs.',
    tags: ['noter', 'évaluation', 'avis', 'commentaire'],
    order: 3,
    isPopular: false,
  },

  // ========================================
  // CATÉGORIE: SÉCURITÉ
  // ========================================
  {
    category: 'security',
    question: 'Mes données personnelles sont-elles protégées ?',
    answer: 'Oui ! Nous prenons la protection de vos données très au sérieux. Toutes les données sont chiffrées et stockées de manière sécurisée. Nous ne partageons jamais vos informations personnelles avec des tiers sans votre consentement. Consultez notre Politique de confidentialité pour plus de détails.',
    tags: ['données personnelles', 'protection', 'confidentialité', 'rgpd'],
    order: 1,
    isPopular: true,
  },
  {
    category: 'security',
    question: 'Comment activer l\'authentification à deux facteurs ?',
    answer: 'Pour renforcer la sécurité de votre compte, allez dans Profil > Paramètres > Sécurité > Authentification à deux facteurs. Suivez les instructions pour activer cette fonctionnalité via SMS ou une application d\'authentification.',
    tags: ['2fa', 'authentification', 'sécurité', 'double facteur'],
    order: 2,
    isPopular: false,
  },
  {
    category: 'security',
    question: 'Que faire si mon compte est piraté ?',
    answer: 'Si vous pensez que votre compte a été compromis, changez immédiatement votre mot de passe et contactez notre support. Nous pourrons sécuriser votre compte et vérifier les activités suspectes.',
    tags: ['piratage', 'sécurité', 'compte compromis', 'aide'],
    order: 3,
    isPopular: false,
  },

  // ========================================
  // CATÉGORIE: TECHNIQUE
  // ========================================
  {
    category: 'technical',
    question: 'L\'application ne se lance pas, que faire ?',
    answer: 'Essayez d\'abord de redémarrer votre téléphone. Si le problème persiste, désinstallez et réinstallez l\'application. Assurez-vous aussi que votre système d\'exploitation est à jour. Si rien ne fonctionne, contactez le support.',
    tags: ['bug', 'crash', 'ne fonctionne pas', 'problème technique'],
    order: 1,
    isPopular: true,
  },
  {
    category: 'technical',
    question: 'La géolocalisation ne fonctionne pas',
    answer: 'Vérifiez que vous avez autorisé l\'accès à la localisation pour Nythy dans les paramètres de votre téléphone. Sur iOS : Réglages > Nythy > Localisation. Sur Android : Paramètres > Applications > Nythy > Autorisations > Localisation.',
    tags: ['géolocalisation', 'gps', 'localisation', 'carte'],
    order: 2,
    isPopular: true,
  },
  {
    category: 'technical',
    question: 'Je ne reçois pas les notifications',
    answer: 'Vérifiez que les notifications sont activées pour Nythy dans les paramètres de votre téléphone. Vérifiez aussi dans l\'application : Profil > Paramètres > Notifications. Assurez-vous que votre connexion internet est stable.',
    tags: ['notifications', 'alertes', 'ne reçois pas'],
    order: 3,
    isPopular: true,
  },
  {
    category: 'technical',
    question: 'Quelle est la configuration minimale requise ?',
    answer: 'Nythy nécessite iOS 13.0 ou supérieur pour iPhone/iPad, et Android 6.0 ou supérieur pour les appareils Android. Une connexion internet (Wi-Fi ou données mobiles) est requise pour utiliser l\'application.',
    tags: ['configuration', 'requise', 'version', 'compatibilité'],
    order: 4,
    isPopular: false,
  },
];

/**
 * Fonction pour créer les FAQs dans Firestore
 */
async function initializeFAQs() {
  console.log('🚀 Début de l\'initialisation des FAQs...\n');

  const now = admin.firestore.Timestamp.now();
  let successCount = 0;
  let errorCount = 0;

  for (const faq of faqs) {
    try {
      // Créer un ID unique
      const docRef = db.collection('faq').doc();

      // Préparer le document avec tous les champs requis
      const faqData = {
        id: docRef.id,
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        tags: faq.tags || [],
        order: faq.order || 0,
        viewCount: 0,
        helpfulCount: 0,
        isPopular: faq.isPopular || false,
        createdAt: now,
        updatedAt: now,
      };

      // Sauvegarder dans Firestore
      await docRef.set(faqData);

      console.log(`✅ FAQ créée: ${faq.question.substring(0, 50)}...`);
      successCount++;
    } catch (error) {
      console.error(`❌ Erreur lors de la création de la FAQ "${faq.question}":`, error);
      errorCount++;
    }
  }

  console.log('\n📊 Résumé:');
  console.log(`   ✅ ${successCount} FAQs créées avec succès`);
  console.log(`   ❌ ${errorCount} erreurs`);
  console.log('\n🎉 Initialisation terminée !');
}

/**
 * Fonction pour supprimer toutes les FAQs existantes (optionnel)
 */
async function clearAllFAQs() {
  console.log('🗑️  Suppression de toutes les FAQs existantes...');

  const snapshot = await db.collection('faq').get();
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
  console.log(`✅ ${snapshot.size} FAQs supprimées\n`);
}

/**
 * Script principal
 */
async function main() {
  try {
    console.log('═══════════════════════════════════════════');
    console.log('  INITIALISATION DES FAQs - NYTHY');
    console.log('═══════════════════════════════════════════\n');

    // Décommenter la ligne suivante pour supprimer les FAQs existantes avant
    // await clearAllFAQs();

    await initializeFAQs();

    console.log('\n✨ Script terminé avec succès !');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
main();

