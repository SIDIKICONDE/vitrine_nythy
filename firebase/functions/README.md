# Cloud Functions pour Nythy

Ce dossier contient les Cloud Functions Firebase qui gèrent automatiquement les compteurs, les paiements Stripe et nettoient les ressources de l'application Nythy.

## Fonctions disponibles

### Gestion des compteurs

#### `updatePostReactionCounts`

- **Trigger**: Firestore document `posts/{postId}/reactions/{reactionId}` (onWrite)
- **Description**: Met à jour automatiquement les compteurs de réactions et le score d'engagement d'un post
- **Actions**:
  - Compte les réactions par type (like, love, helpful, etc.)
  - Calcule le total des likes
  - Recalcule le score d'engagement (likes + commentaires×2 + partages×3 + vues×0.1)

#### `updatePostCommentCounts`

- **Trigger**: Firestore document `posts/{postId}/comments/{commentId}` (onWrite)
- **Description**: Met à jour automatiquement les compteurs de commentaires d'un post
- **Actions**:
  - Compte les commentaires de niveau 0 (non réponses)
  - Recalcule le score d'engagement

#### `updateCommentReplyCounts`

- **Trigger**: Firestore document `posts/{postId}/comments/{commentId}` (onWrite)
- **Description**: Met à jour automatiquement le compteur de réponses d'un commentaire
- **Actions**:
  - Compte les commentaires enfants (parentCommentId == commentId)

#### `incrementPostViews`

- **Trigger**: HTTP Callable Function
- **Description**: Incrémente le compteur de vues d'un post
- **Paramètres**: `{ postId: string }`
- **Actions**:
  - Incrémente viewsCount
  - Recalcule le score d'engagement

### Paiements Stripe

#### `api` (HTTP Function)

- **Endpoint**: `/api/v1/payments` et `/api/v1/webhooks`
- **Description**: API REST sécurisée pour gérer les paiements Stripe
- **Features**:
  - Création de Payment Intent avec validation côté serveur
  - Webhooks Stripe pour la confirmation de paiement
  - Création automatique de commandes après paiement réussi
  - Sécurité: Authentication Firebase, Rate limiting, CORS, Helmet
  - Types TypeScript stricts pour toutes les entités

**Routes disponibles**:

- `POST /api/v1/payments/create-intent` - Crée un Payment Intent
  - Authentification requise (Firebase ID token)
  - Body: `{ reservationId: string }`
  - Réponse: `{ clientSecret: string, paymentIntentId: string }`

- `POST /api/v1/payments/confirm` - Confirme un paiement (usage interne)
  - Authentification requise
  - Body: `{ paymentIntentId: string }`

- `POST /api/v1/webhooks/stripe` - Webhook Stripe
  - Vérifie la signature du webhook
  - Gère: `payment_intent.succeeded`, `payment_intent.payment_failed`
  - Crée automatiquement la commande lors du succès

### Nettoyage des ressources

#### `cleanupPostResources`

- **Trigger**: Firestore document `posts/{postId}` (onDelete)
- **Description**: Nettoie automatiquement toutes les ressources associées lors de la suppression d'un post
- **Actions**:
  - Supprime tous les commentaires
  - Supprime toutes les réactions des commentaires
  - Supprime toutes les réactions du post

## Configuration

### Variables d'environnement Stripe

**Développement local**:

1. Copier `.env.example` en `.env`
2. Remplir les clés Stripe depuis le [Dashboard Stripe](https://dashboard.stripe.com/apikeys)
3. Configurer le webhook local avec [Stripe CLI](https://stripe.com/docs/stripe-cli)

```bash
cp .env.example .env
# Éditer .env avec vos clés
```

**Production (Firebase Functions)**:

Utiliser les variables d'environnement Firebase Functions:

```bash
# Configurer les clés Stripe
firebase functions:config:set \
  stripe.secret_key="sk_live_VOTRE_CLE_LIVE" \
  stripe.webhook_secret="whsec_VOTRE_WEBHOOK_SECRET" \
  cors.allowed_origins="https://votre-domaine.com"

# Vérifier la configuration
firebase functions:config:get
```

**IMPORTANT**: Ne JAMAIS commiter le fichier `.env` ou exposer vos clés secrètes.

### Configuration Webhook Stripe

1. Aller sur [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Ajouter un endpoint: `https://YOUR_REGION-YOUR_PROJECT.cloudfunctions.net/api/api/v1/webhooks/stripe`
3. Sélectionner les événements:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copier le webhook secret `whsec_...` dans la configuration

## Déploiement

```bash
# Installer les dépendances
npm install

# Compiler TypeScript
npm run build

# Déployer toutes les fonctions
firebase deploy --only functions

# Déployer une fonction spécifique
firebase deploy --only functions:api

# Voir les logs
firebase functions:log
```

## Sécurité

Toutes les fonctions respectent les règles Firestore définies dans `../firestore.rules` qui verrouillent les champs de compteurs pour empêcher les modifications directes depuis le client.

## Tests

```bash
# Tester localement avec les émulateurs
firebase emulators:start --only functions

# Dans un autre terminal
npm run shell
```
