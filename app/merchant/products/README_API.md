# 📦 API Products - Documentation

## ✅ État de la connexion

**TOUTES LES PAGES PRODUCTS SONT MAINTENANT CONNECTÉES À L'API FIREBASE !**

---

## 🔥 API Routes

### 1. **GET /api/merchant/me**
Récupère les informations du marchand connecté (nécessaire pour obtenir le `merchantId`).

**Authentification:** ✅ Requise (NextAuth session)

**Response:**
```json
{
  "success": true,
  "merchant": {
    "id": "merchant123",
    "name": "Boulangerie Dupont",
    "email": "contact@boulangerie.fr",
    ...
  }
}
```

---

### 2. **GET /api/merchant/[merchantId]/products**
Récupère tous les produits d'un marchand.

**Authentification:** ✅ Requise  
**Vérifications:** Propriétaire du commerce

**Response:**
```json
{
  "success": true,
  "products": [
    {
      "id": "prod123",
      "title": "Panier surprise",
      "original_price": { "amount_minor": 1500, "currency_code": "EUR" },
      "discounted_price": { "amount_minor": 500, "currency_code": "EUR" },
      "status": "available",
      ...
    }
  ]
}
```

---

### 3. **GET /api/merchant/[merchantId]/products/[productId]**
Récupère un produit spécifique.

**Authentification:** ✅ Requise  
**Vérifications:** Propriétaire du commerce

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "prod123",
    "title": "Panier surprise",
    ...
  }
}
```

---

### 4. **POST /api/merchant/[merchantId]/products**
Crée un nouveau produit.

**Authentification:** ✅ Requise  
**Vérifications:** Propriétaire du commerce

**Request Body:**
```json
{
  "title": "Panier surprise du jour",
  "description": "Un assortiment de produits frais",
  "originalPrice": 15.00,
  "discountedPrice": 5.00,
  "quantity": 5,
  "category": "freshProducts",
  "pickupStart": "2024-01-15T17:00",
  "pickupEnd": "2024-01-15T20:00",
  "expiresAt": "2024-01-15T23:59",
  "dietaryTags": ["vegetarian"],
  "allergenTags": [],
  "isSurpriseBox": true,
  "co2SavedGrams": 300
}
```

**Response:**
```json
{
  "success": true,
  "productId": "prod123",
  "sku": "BOU-20240115-001",
  "message": "Produit créé avec succès"
}
```

**Fonctionnalités:**
- ✅ Génération automatique de SKU unique
- ✅ Conversion des prix en centimes
- ✅ Normalisation des statuts
- ✅ Mise à jour des statistiques du marchand
- ✅ Validation des champs

---

### 5. **PUT /api/merchant/[merchantId]/products/[productId]**
Met à jour un produit existant.

**Authentification:** ✅ Requise  
**Vérifications:** Propriétaire du commerce

**Request Body:** (Champs optionnels)
```json
{
  "title": "Nouveau titre",
  "quantity": 10,
  "status": "available"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Produit mis à jour avec succès"
}
```

---

### 6. **DELETE /api/merchant/[merchantId]/products/[productId]**
Supprime un produit.

**Authentification:** ✅ Requise  
**Vérifications:** Propriétaire du commerce

**Response:**
```json
{
  "success": true,
  "message": "Produit supprimé avec succès"
}
```

**Fonctionnalités:**
- ✅ Mise à jour des statistiques du marchand
- ✅ Décrément du compteur de produits

---

## 📄 Pages Connectées

### ✅ 1. **`/merchant/products/page.tsx`** - Liste des produits
**Connexions:**
- GET `/api/merchant/me` → Récupère le merchantId
- GET `/api/merchant/[merchantId]/products` → Charge tous les produits
- PUT `/api/merchant/[merchantId]/products/[productId]` → Change le statut
- DELETE `/api/merchant/[merchantId]/products/[productId]` → Supprime un produit

**Features:**
- ✅ Chargement des produits depuis Firestore
- ✅ Filtres (recherche, catégorie, actifs seulement)
- ✅ Actions (modifier, activer/désactiver, supprimer)
- ✅ Affichage des erreurs
- ✅ Skeleton loading

---

### ✅ 2. **`/merchant/products/new/page.tsx`** - Nouveau produit
**Connexions:**
- GET `/api/merchant/me` → Récupère le merchantId
- POST `/api/merchant/[merchantId]/products` → Crée le produit

**Features:**
- ✅ Création de produit dans Firestore
- ✅ Validation côté client et serveur
- ✅ Redirection après création
- ✅ Gestion des erreurs

---

### ✅ 3. **`/merchant/products/[id]/edit/page.tsx`** - Édition
**Connexions:**
- GET `/api/merchant/me` → Récupère le merchantId
- GET `/api/merchant/[merchantId]/products/[productId]` → Charge le produit
- PUT `/api/merchant/[merchantId]/products/[productId]` → Met à jour

**Features:**
- ✅ Chargement du produit depuis Firestore
- ✅ Pré-remplissage du formulaire
- ✅ Mise à jour dans Firestore
- ✅ Normalisation des données (snake_case ↔ camelCase)
- ✅ Affichage des erreurs

---

## 🔐 Sécurité

### Authentification
- ✅ Toutes les routes nécessitent une session NextAuth
- ✅ Vérification du `userId` dans la session

### Autorisation
- ✅ Vérification que l'utilisateur est propriétaire du commerce
- ✅ Validation via `owner_user_id` ou `ownerUserId` dans Firestore

### Validation
- ✅ Validation côté serveur (champs requis, types, formats)
- ✅ Validation métier (prix réduit < prix original)
- ✅ Sanitization des données

---

## 📊 Structure Firestore

```
merchants/
  {merchantId}/
    products/
      {productId}/
        - title: string
        - description: string
        - sku: string (généré auto)
        - original_price: { amount_minor, currency_code }
        - discounted_price: { amount_minor, currency_code }
        - quantity: number
        - status: "available" | "sold-out" | "scheduled" | "archived" | "expired"
        - category: string
        - subcategory: string?
        - dietary_tags: string[]
        - allergen_tags: string[]
        - images: { url, is_primary, alt, width, height }[]
        - is_surprise_box: boolean
        - surprise_description: string?
        - co2_saved_grams: number?
        - weight_grams: number?
        - pickup_instructions: string?
        - pickup_start: ISO timestamp
        - pickup_end: ISO timestamp
        - expires_at: ISO timestamp?
        - max_per_user: number?
        - view_count: number
        - purchase_count: number
        - created_at: ISO timestamp
        - updated_at: ISO timestamp
```

---

## 🎯 Normalisation des données

### Frontend → API (camelCase → snake_case)
```typescript
{
  originalPrice → original_price
  discountedPrice → discounted_price
  maxPerUser → max_per_user
  pickupStart → pickup_start
  pickupEnd → pickup_end
  expiresAt → expires_at
  dietaryTags → dietary_tags
  allergenTags → allergen_tags
  isSurpriseBox → is_surprise_box
  surpriseDescription → surprise_description
  co2SavedGrams → co2_saved_grams
  weightGrams → weight_grams
  pickupInstructions → pickup_instructions
}
```

### API → Frontend (snake_case → camelCase)
Inversement des conversions ci-dessus.

---

## 🚀 Prochaines étapes

### À implémenter :
- [ ] GET avec filtres (status, category, date)
- [ ] GET avec pagination
- [ ] Upload d'images (Firestore Storage)
- [ ] Gestion des stocks en temps réel
- [ ] Notifications push lors de création/modification
- [ ] Analytics (vues, achats)

---

## 📝 Notes importantes

1. **Prix :** Toujours en centimes dans la base (amount_minor)
2. **Dates :** Format ISO 8601 (UTC)
3. **SKU :** Format `{PREFIX}-{YYYYMMDD}-{XXX}` (auto-généré)
4. **Images :** Limite de 10 images par produit
5. **Statuts :** Normalisés automatiquement

---

**Dernière mise à jour :** 7 novembre 2024  
**Statut :** ✅ Toutes les pages connectées et fonctionnelles

