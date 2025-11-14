# 📚 Initialisation des FAQs dans Firestore

Ce guide explique comment initialiser la collection FAQ dans Firestore pour l'application Nythy.

## 📋 Prérequis

1. **Node.js** installé (version 14 ou supérieure)
2. **Firebase Admin SDK** configuré
3. **Accès administrateur** à votre projet Firebase

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd firebase
npm install firebase-admin
```

### 2. Configurer l'authentification Firebase

Vous avez deux options :

#### Option A : Application Default Credentials (recommandé pour développement)

```bash
# Installer Firebase CLI si ce n'est pas déjà fait
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Définir le projet par défaut
firebase use --add
```

#### Option B : Service Account (recommandé pour production)

1. Allez dans [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Allez dans **Paramètres du projet** (⚙️) > **Comptes de service**
4. Cliquez sur **Générer une nouvelle clé privée**
5. Sauvegardez le fichier JSON dans `firebase/scripts/service-account.json`
6. Modifiez le script `init_faq.js` pour utiliser ce fichier :

```javascript
admin.initializeApp({
  credential: admin.credential.cert(require('./service-account.json'))
});
```

⚠️ **Important** : N'ajoutez jamais le fichier `service-account.json` au contrôle de version !

## 📝 Exécution du script

### Créer les FAQs

```bash
cd firebase
node scripts/init_faq.js
```

### Supprimer et recréer toutes les FAQs

Décommentez la ligne dans le script `init_faq.js` :

```javascript
// await clearAllFAQs();  // <-- Décommenter cette ligne
```

Puis exécutez :

```bash
node scripts/init_faq.js
```

## 📊 Structure des FAQs créées

Le script crée **30 FAQs** réparties dans **7 catégories** :

| Catégorie | Nombre de FAQs | Populaires |
|-----------|----------------|------------|
| 🔹 Général (`general`) | 4 | 3 |
| 👤 Compte (`account`) | 4 | 2 |
| 💳 Paiement (`payment`) | 4 | 3 |
| 📦 Commandes (`orders`) | 5 | 4 |
| 🏪 Commerçants (`merchants`) | 3 | 1 |
| 🔒 Sécurité (`security`) | 3 | 1 |
| ⚙️ Technique (`technical`) | 4 | 3 |

## 🔍 Vérification dans Firestore

### Via Firebase Console

1. Allez dans [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Allez dans **Firestore Database**
4. Cherchez la collection `faq`
5. Vous devriez voir 30 documents

### Via Firebase CLI

```bash
firebase firestore:get faq --limit 5
```

## 🎨 Personnalisation des FAQs

Pour ajouter ou modifier des FAQs, éditez le tableau `faqs` dans `init_faq.js` :

```javascript
const faqs = [
  {
    category: 'general',  // Catégorie (general, account, payment, orders, merchants, security, technical)
    question: 'Ma question ?',
    answer: 'Ma réponse détaillée',
    tags: ['tag1', 'tag2', 'tag3'],  // Tags pour la recherche
    order: 1,  // Ordre d'affichage (plus petit = plus haut)
    isPopular: true,  // Afficher dans "Questions populaires"
  },
  // ... autres FAQs
];
```

### Catégories disponibles

```dart
enum FaqCategory {
  general    // ❓ Général
  account    // 👤 Compte
  payment    // 💳 Paiement
  orders     // 📦 Commandes
  merchants  // 🏪 Commerçants
  security   // 🔒 Sécurité
  technical  // ⚙️ Technique
}
```

## 📈 Index Firestore

Les index suivants ont été configurés dans `firestore.indexes.json` :

1. **Catégorie + Ordre** : Pour trier les FAQs par catégorie
2. **Popularité + Vues** : Pour afficher les questions populaires
3. **Catégorie + Utile** : Pour trier par nombre de "👍 Utile"

### Déployer les index

```bash
firebase deploy --only firestore:indexes
```

## 🔐 Règles de sécurité

Les règles Firestore pour la collection `faq` sont déjà configurées dans `firestore.rules` :

```javascript
match /faq/{faqId} {
  allow read: if true;  // Lecture publique
  allow create, update, delete: if isAdmin();  // Écriture admin uniquement
}
```

### Déployer les règles

```bash
firebase deploy --only firestore:rules
```

## 🧪 Test de l'intégration

### 1. Générer les fichiers Freezed

```bash
cd ..  # Retour à la racine du projet
flutter pub run build_runner build --delete-conflicting-outputs
```

### 2. Lancer l'application

```bash
flutter run
```

### 3. Naviguer vers les FAQs

1. Ouvrez l'application
2. Allez dans **Profil** > **Paramètres**
3. Cliquez sur **Aide et support** dans la section Support
4. Vous devriez voir les FAQs chargées depuis Firestore

## 🐛 Dépannage

### Erreur : "Default app does not exist"

```bash
# Vérifiez que vous êtes connecté à Firebase
firebase login

# Vérifiez le projet actif
firebase projects:list
firebase use YOUR_PROJECT_ID
```

### Erreur : "Permission denied"

Assurez-vous d'avoir les droits administrateur sur le projet Firebase.

### Les FAQs ne s'affichent pas dans l'app

1. Vérifiez que les FAQs sont bien dans Firestore
2. Vérifiez les règles de sécurité (lecture publique)
3. Vérifiez les logs de l'application

```bash
flutter logs
```

## 📚 Ressources supplémentaires

- [Documentation Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Documentation Firestore](https://firebase.google.com/docs/firestore)
- [Guide Freezed](https://pub.dev/packages/freezed)

## ✨ Prochaines étapes

1. ✅ Déployer les index Firestore
2. ✅ Déployer les règles de sécurité
3. ✅ Exécuter le script d'initialisation
4. ✅ Tester dans l'application
5. 📝 Créer une interface admin pour gérer les FAQs
6. 📊 Ajouter des analytics sur les FAQs les plus consultées

---

💡 **Besoin d'aide ?** Consultez la [documentation complète du module Support](../../lib/features/support/README.md)

