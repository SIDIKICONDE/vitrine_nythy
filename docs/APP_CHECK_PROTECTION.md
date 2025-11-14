# 🔐 Protection App Check - Toutes les Routes API

## 📋 Vue d'ensemble

**TOUTES les routes API sensibles** sont maintenant protégées par **Firebase App Check** en mode strict avec protection contre le rejeu sur les opérations d'écriture.

---

## ✅ Routes protégées (23 endpoints)

### 📖 **Routes GET (Lecture) - App Check mode strict**

| Route | Description | Strict Mode |
|-------|-------------|-------------|
| `GET /api/merchant/me` | Info marchand connecté | ✅ OUI |
| `GET /api/merchant/[merchantId]/orders` | Liste des commandes | ✅ OUI |
| `GET /api/merchant/[merchantId]/orders/[orderId]` | Détails commande | ✅ OUI |
| `GET /api/merchant/[merchantId]/dashboard` | Dashboard marchand | ✅ OUI |
| `GET /api/merchant/[merchantId]/products` | Liste des produits | ✅ OUI |
| `GET /api/merchant/[merchantId]/products/[productId]` | Détails produit | ✅ OUI |
| `GET /api/merchant/[merchantId]/reviews` | Liste des avis | ✅ OUI |
| `GET /api/merchant/[merchantId]/customers` | Liste des clients | ✅ OUI |
| `GET /api/merchant/[merchantId]/finances/summary` | Résumé financier | ✅ OUI |
| `GET /api/merchant/[merchantId]/finances/transactions` | Transactions | ✅ OUI |
| `GET /api/merchant/[merchantId]/finances/payouts` | Versements | ✅ OUI |
| `GET /api/merchant/[merchantId]/stats/sales` | Stats ventes | ✅ OUI |
| `GET /api/merchant/[merchantId]/stats/impact` | Stats impact | ✅ OUI |

### ✍️ **Routes POST/PUT/PATCH/DELETE (Écriture) - App Check + Protection rejeu**

| Route | Description | Strict Mode | Protection Rejeu |
|-------|-------------|-------------|------------------|
| `POST /api/merchant/register` | Inscription marchand | ✅ OUI | 🛡️ OUI |
| `POST /api/merchant/upload` | Upload images | ✅ OUI | 🛡️ OUI |
| `DELETE /api/merchant/upload` | Suppression images | ✅ OUI | 🛡️ OUI |
| `PUT /api/merchant/[merchantId]` | Mise à jour marchand | ✅ OUI | 🛡️ OUI |
| `DELETE /api/merchant/[merchantId]` | Suppression marchand | ✅ OUI | 🛡️ OUI |
| `PATCH /api/merchant/[merchantId]/settings` | Mise à jour paramètres | ✅ OUI | 🛡️ OUI |
| `POST /api/merchant/[merchantId]/products` | Création produit | ✅ OUI | 🛡️ OUI |
| `PUT /api/merchant/[merchantId]/products/[productId]` | Mise à jour produit | ✅ OUI | 🛡️ OUI |
| `DELETE /api/merchant/[merchantId]/products/[productId]` | Suppression produit | ✅ OUI | 🛡️ OUI |
| `PUT /api/merchant/[merchantId]/orders/[orderId]` | Mise à jour commande | ✅ OUI | 🛡️ OUI |
| `POST /api/merchant/[merchantId]/reviews/respond` | Répondre à un avis | ✅ OUI | 🛡️ OUI |
| `PUT /api/user/profile` | Mise à jour profil | ✅ OUI | 🛡️ OUI |
| `PUT /api/user/device-token` | Mise à jour token | ✅ OUI | 🛡️ OUI |

---

## 🔑 Configuration

### Côté Client (Flutter)
```dart
// lib/core/services/Security/firebase_service.dart (lignes 127-172)
await FirebaseAppCheck.instance.activate(
  androidProvider: AndroidProvider.playIntegrity,
  appleProvider: AppleProvider.appAttestWithDeviceCheckFallback,
  webProvider: ReCaptchaV3Provider(recaptchaV3Key),
);
```

### Côté Serveur (Next.js)
```typescript
// lib/app-check-middleware.ts
import { verifyAppCheckToken } from '@/lib/app-check-middleware';

// Exemple usage:
const appCheckResult = await verifyAppCheckToken(request, { 
  strict: true,           // Bloquer les requêtes sans token
  consumeToken: true      // Protection contre le rejeu (endpoints sensibles)
});
```

---

## 🛡️ Niveaux de protection

### **Niveau 1 - Standard** (Routes GET)
- ✅ Vérification du jeton App Check
- ✅ Mode strict : bloque si invalide
- ❌ Pas de consommation du jeton

**Utilisé pour** : Lecture de données

### **Niveau 2 - Protection rejeu** (Routes POST/PUT/PATCH/DELETE)
- ✅ Vérification du jeton App Check
- ✅ Mode strict : bloque si invalide
- ✅ Consommation du jeton (usage unique)

**Utilisé pour** : Création, modification, suppression

---

## 📊 Réponses d'erreur

### Jeton manquant
```json
{
  "success": false,
  "error": "App Check token missing",
  "message": "Jeton App Check manquant"
}
```
**Status**: `401 Unauthorized`

### Jeton invalide
```json
{
  "success": false,
  "error": "Invalid App Check token",
  "message": "Jeton App Check invalide",
  "details": "..."
}
```
**Status**: `401 Unauthorized`

### Jeton déjà consommé (protection rejeu)
```json
{
  "success": false,
  "error": "Token already consumed",
  "message": "Jeton déjà utilisé (protection contre le rejeu)"
}
```
**Status**: `401 Unauthorized`

---

## 🧪 Tests

### Tester avec un jeton valide
```bash
# Le client Flutter envoie automatiquement le header
X-Firebase-AppCheck: <token>
```

### Tester sans jeton (doit échouer)
```bash
curl -X GET https://your-domain.com/api/merchant/me
# Retourne: 401 Unauthorized
```

---

## 🔧 Désactiver temporairement (développement uniquement)

Si vous devez désactiver temporairement App Check pour le développement :

```typescript
// Dans chaque route, changer:
const appCheckResult = await verifyAppCheckToken(request, { 
  strict: false  // ⚠️ NE PAS FAIRE EN PRODUCTION
});
```

---

## 📝 Notes importantes

1. ✅ **Client Flutter** : App Check déjà configuré et fonctionnel
2. ✅ **Serveur Next.js** : Vérification activée sur toutes les routes marchands
3. ✅ **Protection rejeu** : Activée sur les opérations critiques
4. ⚠️ **Performance** : La protection rejeu ajoute ~50ms de latence
5. ⚠️ **Quotas** : Firebase offre 10 000 vérifications/jour gratuitement

---

## 📊 Résumé par catégorie

### Routes Marchands : **21 endpoints** 🔐
- 📖 Lecture : 13 routes en mode strict
- ✍️ Écriture : 8 routes en mode strict + protection rejeu

### Routes Utilisateurs : **2 endpoints** 🔐
- ✍️ Écriture : 2 routes en mode strict + protection rejeu

### Routes Publiques : **Non protégées** ✅
- Articles publics
- Recherche marchands (accessible sans authentification)

---

## 🚀 Statut actuel

| Composant | Statut | Mode |
|-----------|--------|------|
| Client Flutter | ✅ Activé | Production (PlayIntegrity/AppAttest) |
| Serveur Next.js | ✅ Activé | Strict (bloque les requêtes invalides) |
| Routes Marchands | ✅ 100% protégées | 21/21 endpoints |
| Routes Utilisateurs | ✅ 100% protégées | 2/2 endpoints |
| Protection rejeu | ✅ Activé | 10 opérations d'écriture |
| Monitoring | ⚠️ À configurer | Firebase Console |

---

## 📈 Prochaines étapes

1. ✅ **FAIT** : Activer App Check sur toutes les routes marchands
2. 📊 **TODO** : Monitorer les tentatives d'accès non autorisées
3. 🔔 **TODO** : Configurer des alertes pour les abus
4. 📝 **TODO** : Logger les violations dans Firestore
5. 🧪 **TODO** : Tests automatisés avec App Check

---

**Dernière mise à jour** : 13 novembre 2024
**Statut** : 🟢 Activé en production

