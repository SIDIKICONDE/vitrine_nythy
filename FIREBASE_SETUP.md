# Configuration Firebase pour les Articles

## 📋 Étapes de configuration

### 1. Obtenir les credentials Firebase

#### A. Configuration Client (Frontend)

1. Aller sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionner le projet `nythy-dev`
3. Aller dans **Paramètres du projet** (⚙️) → **Général**
4. Descendre jusqu'à "Vos applications" et cliquer sur l'icône Web `</>`
5. Copier les valeurs de `firebaseConfig`

#### B. Configuration Admin (Backend)

1. Dans Firebase Console, aller dans **Paramètres du projet** (⚙️)
2. Onglet **Comptes de service**
3. Cliquer sur **Générer une nouvelle clé privée**
4. Un fichier JSON sera téléchargé

### 2. Mettre à jour `.env.local`

Ouvrir le fichier `.env.local` et remplacer les valeurs Firebase :

```env
# Firebase Configuration (Client)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nythy-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nythy-dev
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nythy-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# Firebase Admin (Server) - depuis le fichier JSON téléchargé
FIREBASE_PROJECT_ID=nythy-dev
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@nythy-dev.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=nythy-dev.appspot.com
```

⚠️ **Important** : La clé privée doit être entre guillemets et contenir les `\n`

### 3. Configurer Firestore

#### Créer la collection `articles`

Dans Firebase Console :
1. Aller dans **Firestore Database**
2. Créer une collection `articles`
3. Ajouter un document de test (optionnel)

#### Structure d'un document article :

```json
{
  "title": "Titre de l'article",
  "description": "Description courte",
  "content": "Contenu complet en Markdown",
  "category": "blog",
  "status": "published",
  "badge": "Nouveau",
  "imageUrl": "https://...",
  "author": "Sidiki Condé",
  "slug": "titre-de-l-article",
  "createdAt": Timestamp,
  "updatedAt": Timestamp,
  "publishedAt": Timestamp
}
```

#### Règles Firestore

Ajouter ces règles dans **Firestore Database** → **Règles** :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Articles - lecture publique, écriture admin seulement
    match /articles/{articleId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```

### 4. Configurer Storage (pour les images)

Dans **Storage** → **Règles** :

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /articles/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 5. Redémarrer le serveur

```bash
npm run dev
```

## ✅ Vérification

1. Aller sur `/admin/articles`
2. Créer un nouvel article
3. L'article doit être sauvegardé dans Firestore
4. Vérifier dans Firebase Console → Firestore Database

## 🔧 Dépannage

### Erreur "Firebase: Error (auth/invalid-api-key)"
→ Vérifier que `NEXT_PUBLIC_FIREBASE_API_KEY` est correct

### Erreur "Firebase Admin: Error initializing"
→ Vérifier que `FIREBASE_PRIVATE_KEY` contient bien les `\n` et est entre guillemets

### Les articles ne s'affichent pas
→ Vérifier les règles Firestore (lecture publique activée)

## 📚 Documentation

- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore](https://firebase.google.com/docs/firestore)

