# Nythy Backend - Firebase Functions pour Stripe

Backend serverless pour gérer les paiements Stripe de l'application Nythy.

## 📋 Prérequis

- Node.js 18+
- Firebase CLI (`npm install -g firebase-tools`)
- Compte Stripe (Test & Production)
- Projet Firebase configuré

## 🚀 Installation

### 1. Installer les dépendances

```bash
cd functions
npm install
```

### 2. Configurer les variables d'environnement

Créer un fichier `.env` basé sur `.env.example` :

```bash
cp .env.example .env
```

Éditer `.env` avec vos clés Stripe :

```env
STRIPE_SECRET_KEY_TEST=sk_test_VOTRE_CLE_TEST
STRIPE_SECRET_KEY_LIVE=sk_live_VOTRE_CLE_PROD
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK
FIREBASE_PROJECT_ID=votre-project-id
NODE_ENV=development
```

### 3. Configurer Firebase Functions

```bash
firebase functions:config:set stripe.secret_key_test="sk_test_VOTRE_CLE_TEST"
firebase functions:config:set stripe.secret_key_live="sk_live_VOTRE_CLE_PROD"
firebase functions:config:set stripe.webhook_secret="whsec_VOTRE_SECRET_WEBHOOK"
```

## 🔑 Obtenir les clés Stripe

### Clés API

1. Aller sur https://dashboard.stripe.com/
2. Accéder à **Developers > API keys**
3. Copier :
   - **Publishable key** (pk_test_...) → Pour l'app Flutter
   - **Secret key** (sk_test_...) → Pour le backend

### Secret Webhook

1. Aller sur **Developers > Webhooks**
2. Cliquer sur **Add endpoint**
3. URL : `https://REGION-PROJECT_ID.cloudfunctions.net/api/api/v1/webhooks/stripe`
4. Sélectionner les événements :
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
5. Copier le **Signing secret** (whsec_...)

## 🏗️ Développement Local

### Démarrer l'émulateur Firebase

```bash
npm run serve
```

L'API sera disponible sur `http://localhost:5001/PROJECT_ID/europe-west1/api`

### Tester avec Stripe CLI

1. Installer Stripe CLI : https://stripe.com/docs/stripe-cli
2. Se connecter : `stripe login`
3. Forwarder les webhooks locaux :

```bash
stripe listen --forward-to localhost:5001/PROJECT_ID/europe-west1/api/api/v1/webhooks/stripe
```

4. Tester un paiement :

```bash
stripe trigger payment_intent.succeeded
```

## 📦 Déploiement

### Compilation

```bash
npm run build
```

### Déployer sur Firebase

```bash
npm run deploy
```

Ou avec Firebase CLI :

```bash
firebase deploy --only functions
```

### Vérifier le déploiement

```bash
curl https://REGION-PROJECT_ID.cloudfunctions.net/api/health
```

## 🔐 Sécurité

### Configuration du CORS en production

Modifier `src/index.ts` :

```typescript
app.use(cors({ 
  origin: ['https://votre-domaine.com'],
  credentials: true 
}));
```

### Configurer les règles Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reservations/{reservationId} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
    
    match /orders/{orderId} {
      allow read: if request.auth != null 
        && request.auth.uid == resource.data.userId;
      allow write: if false; // Seul le backend peut écrire
    }
  }
}
```

## 📡 API Endpoints

### POST /api/v1/payments/create-intent

Crée un Payment Intent Stripe

**Headers:**
```
Authorization: Bearer <FIREBASE_ID_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "reservationId": "reservation_123",
  "userId": "user_abc",
  "amount": 1500,
  "currency": "eur"
}
```

**Response:**
```json
{
  "success": true,
  "paymentIntent": {
    "id": "pi_123",
    "clientSecret": "pi_123_secret_abc",
    "amount": 1500,
    "currency": "eur",
    "status": "requires_payment_method"
  }
}
```

### POST /api/v1/payments/cancel

Annule un Payment Intent

**Body:**
```json
{
  "paymentIntentId": "pi_123"
}
```

### GET /api/v1/payments/customer

Récupère les infos du customer Stripe

### POST /api/v1/webhooks/stripe

Webhook Stripe (appelé automatiquement par Stripe)

## 🧪 Tests

### Tester la création de Payment Intent

```bash
curl -X POST https://YOUR_FUNCTION_URL/api/v1/payments/create-intent \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reservationId": "test_reservation",
    "userId": "test_user",
    "amount": 1500,
    "currency": "eur"
  }'
```

### Cartes de test Stripe

- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0025 0000 3155`

Date : N'importe quelle date future  
CVC : N'importe quel 3 chiffres

## 📊 Monitoring

### Logs Firebase

```bash
firebase functions:log
```

### Logs Stripe

Dashboard Stripe > **Developers > Logs**

### Métriques

Firebase Console > **Functions** > Onglet "Metrics"

## 🔄 Flux de paiement complet

1. **App** : Utilisateur sélectionne une offre
2. **App** : Crée une réservation (10 min de validité)
3. **App** : Appelle `/create-intent` avec `reservationId`
4. **Backend** : Crée le Payment Intent Stripe
5. **Backend** : Retourne `clientSecret` à l'app
6. **App** : Affiche l'interface de paiement Stripe
7. **Utilisateur** : Entre ses infos bancaires
8. **Stripe** : Traite le paiement
9. **Stripe** : Envoie webhook `payment_intent.succeeded`
10. **Backend** : Crée la commande avec code de retrait
11. **Backend** : Notifie l'utilisateur et le marchand

## ⚠️ Important

- **Ne jamais** commiter les clés Stripe dans le code
- Utiliser les clés de **test** en développement
- Activer 3D Secure en production
- Mettre en place des limites de montant
- Logger toutes les transactions pour audit

## 🆘 Dépannage

### Erreur "Webhook signature verification failed"

Vérifier que le `STRIPE_WEBHOOK_SECRET` correspond au secret du webhook créé.

### Erreur "Unauthorized"

Vérifier que le token Firebase est valide et non expiré.

### Payment Intent déjà utilisé

Un Payment Intent ne peut être confirmé qu'une seule fois. Créer un nouveau Payment Intent.

## 📚 Documentation

- [Stripe API](https://stripe.com/docs/api)
- [Firebase Functions](https://firebase.google.com/docs/functions)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

## 📝 License

Propriétaire - Nythy © 2025
