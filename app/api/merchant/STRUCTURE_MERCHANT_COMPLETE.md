# 📋 Structure complète du document Merchant

## 🎯 Lors de l'inscription, voici EXACTEMENT ce qui est créé :

---

## 1. 🔐 Firebase Authentication
```
userId: "AyzsoujN0lSF9ht5JMS8DVXm7642" (généré auto)
email: "conde.sidiki@outlook.fr"
password: (hashé)
```

---

## 2. 📦 Document `merchants/{merchantId}`

### ✅ Structure EXACTE créée automatiquement :

```javascript
{
  // 📝 INFORMATIONS DE BASE
  "name": "boulagerie du coins",
  "name_lowercase": "boulagerie du coins",
  "email": "conde.sidiki@outlook.fr",
  "phone": "+33600000000",
  "description": "Description du commerce...",

  // 🏠 ADRESSE
  "address": "Rue de Rivoli",
  "addressLine1": "Rue de Rivoli",
  "city": "Paris",
  "postalCode": "67100",
  "country": "France",
  "countryCode": "FR",

  // 📍 LOCALISATION (objet avec lat/long)
  "location": {
    "latitude": 48.8566,
    "longitude": 2.3522
  },

  // 🏪 TYPE D'ACTIVITÉ
  "category": "boulangerie",
  "merchantType": "boulangerie",

  // 👤 PROPRIÉTAIRE (3 versions pour compatibilité)
  "ownerUserId": "AyzsoujN0lSF9ht5JMS8DVXm7642",
  "ownerId": "AyzsoujN0lSF9ht5JMS8DVXm7642",
  "owner_user_id": "AyzsoujN0lSF9ht5JMS8DVXm7642",

  // 🆔 IDENTIFIANTS LÉGAUX
  "taxId": "00000000000000",
  "siret": "00000000000000",

  // 📊 STATUTS
  "status": "pending",
  "isActive": true,
  "isVerified": false,
  "rating": 0,
  "reviewCount": 0,
  "totalSales": 0,

  // ⚙️ OPTIONS
  "acceptsSurpriseBox": false,
  "languages": ["fr"],
  "preferredCurrency": "EUR",
  "timezone": "Europe/Paris",

  // 🚚 OPTIONS DE LIVRAISON
  "deliveryOptions": {
    "inStorePickup": true,
    "localDelivery": false
  },

  // 📈 STATISTIQUES
  "stats": {
    "totalSales": 0,
    "totalOrders": 0,
    "averageRating": 0,
    "totalReviews": 0
  },

  // ⏰ TIMESTAMPS (format ISO 8601)
  "createdAt": "2025-11-07T06:41:24.694Z",
  "updatedAt": "2025-11-07T06:41:24.694Z",
  "termsAcceptedAt": "2025-11-07T06:41:24.694Z"
}
```

---

## 3. 👤 Document `users/{userId}`

```javascript
{
  "role": "storeOwner",
  "merchantId": "merchantId_généré",
  "email": "conde.sidiki@outlook.fr",
  "createdAt": "2025-11-07T06:41:24.694Z",
  "updatedAt": "2025-11-07T06:41:24.694Z"
}
```

---

## 4. 📊 Sous-collection `merchants/{merchantId}/stats/summary`

```javascript
{
  "viewCount": 0,
  "favoriteCount": 0,
  "productCount": 0,
  "offerCount": 0,
  "lastUpdated": "2025-11-07T06:41:24.694Z"
}
```

---

## 📋 DÉTAILS DES CHAMPS

### 🔑 Champs requis du formulaire :
- `email` ✅
- `password` ✅ (min 12 caractères)
- `businessName` → devient `name` ✅
- `merchantType` → devient `category` et `merchantType` ✅
- `address` → devient `addressLine1` et `address` ✅
- `postalCode` ✅
- `city` ✅
- `description` ✅

### 🔄 Champs générés automatiquement :
- `name_lowercase` → Version minuscule du nom (pour recherche)
- `ownerUserId`, `ownerId`, `owner_user_id` → userId de Firebase Auth
- `merchantId` → ID généré par Firestore
- Tous les timestamps
- Toutes les valeurs par défaut

### 📍 Localisation par défaut :
Si non fournie, utilise **Paris centre** :
```javascript
latitude: 48.8566
longitude: 2.3522
```

### 📞 Valeurs temporaires à mettre à jour :
```javascript
phone: "+33600000000"     // ⚠️ Temporaire
taxId: "00000000000000"   // ⚠️ Temporaire
siret: "00000000000000"   // ⚠️ Temporaire
```

---

## 🔄 FORMAT DES DONNÉES

### Timestamps
- **Type :** String ISO 8601
- **Format :** `"2025-11-07T06:41:24.694Z"`
- **Timezone :** UTC
- **Utilisés pour :** `createdAt`, `updatedAt`, `termsAcceptedAt`, `lastUpdated`

### Location
- **Type :** Objet (pas GeoPoint)
- **Structure :**
```javascript
{
  "latitude": 48.8566,    // number
  "longitude": 2.3522     // number
}
```

### Statuts disponibles
```javascript
status: "pending" | "verified" | "suspended" | "rejected"
```

### Types de commerce (merchantType)
```javascript
"restaurant" | "boulangerie" | "patisserie" | "supermarche" |
"epicerie" | "cafe" | "traiteur" | "primeur" | "boucherie" |
"charcuterie" | "poissonnerie" | "fromagerie" | "chocolaterie" |
"glaciere" | "pizzeria" | "fastFood" | "biologique" | "vegan" | "autre"
```

---

## 🎯 Compatibilité

### Pourquoi 3 versions du owner ID ?
```javascript
ownerUserId   → Format camelCase (JavaScript)
ownerId       → Format court (simplifié)
owner_user_id → Format snake_case (Python/Cloud Functions)
```
Cela assure la compatibilité avec tous les systèmes (Web, Flutter, Cloud Functions).

---

## ✅ Validation automatique

L'API valide automatiquement :
- ✅ Email valide
- ✅ Mot de passe ≥ 12 caractères
- ✅ Email non déjà utilisé
- ✅ Tous les champs requis présents

---

## 📊 Collections Firestore créées

```
✅ merchants/{merchantId}
   └── stats/
       └── summary

✅ users/{userId}
```

**Note :** Les collections `products/` et `orders/` seront créées plus tard quand le marchand ajoutera des produits.

---

## 🔐 Accès et permissions

Après inscription :
- ✅ Peut se connecter avec email/password
- ✅ Peut créer des produits
- ✅ Peut voir son dashboard
- ⏳ En attente de vérification (`status: "pending"`)
- ❌ Ne peut pas encore recevoir de commandes (tant que `isVerified: false`)

---

**Cette structure est identique à celle générée par le système actuel et garantit une compatibilité totale avec Flutter et les Cloud Functions.**

