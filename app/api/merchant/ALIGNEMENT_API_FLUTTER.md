# 📊 Analyse d'alignement API Merchant ↔️ Flutter

## ✅ **ENDPOINTS CORRIGÉS ET ALIGNÉS (camelCase)**

### 1. `/api/merchant/[merchantId]/products` ✅
- **Statut:** ✅ CORRIGÉ
- **Transformation:** `transformProductForFlutter()`
- **Champs transformés:** 30+ champs convertis de snake_case → camelCase

### 2. `/api/merchant/[merchantId]/products/[productId]` ✅
- **Statut:** ✅ CORRIGÉ
- **Transformation:** `transformProductForFlutter()`

### 3. `/api/merchant/[merchantId]/orders` ✅
- **Statut:** ✅ CORRIGÉ
- **Transformation:** `transformOrderForFlutter()`
- **Champs transformés:** 20+ champs de commandes

### 4. `/api/merchant/[merchantId]/orders/[orderId]` ✅
- **Statut:** ✅ CORRIGÉ
- **Transformation:** `transformOrderForFlutter()`

### 5. `/api/merchant/[merchantId]/reviews` ✅
- **Statut:** ✅ CORRIGÉ
- **Transformation:** `transformReviewForFlutter()`
- **Champs transformés:** 15+ champs d'avis

### 6. `/api/merchant/[merchantId]/stats/sales` ✅
- **Statut:** ✅ DÉJÀ BON
- **Raison:** Les réponses sont construites directement en camelCase
- **Champs:** `totalRevenue`, `totalOrders`, `averageOrderValue`, etc.

### 7. `/api/merchant/[merchantId]/customers` ✅
- **Statut:** ✅ DÉJÀ BON
- **Raison:** Les réponses sont construites en camelCase
- **Champs:** `totalOrders`, `completedOrders`, `totalSpent`, `lastOrderDate`, `isVIP`

### 8. `/api/merchant/[merchantId]/dashboard` ✅
- **Statut:** ✅ DÉJÀ BON
- **Raison:** Les réponses sont construites en camelCase
- **Champs:** `recentOrders`, `topProducts`, `weeklyRevenue`, etc.

### 9. `/api/merchant/[merchantId]/finances/summary` ✅
- **Statut:** ✅ DÉJÀ BON
- **Raison:** Réponses construites en camelCase
- **Champs:** `totalRevenue`, `totalPayouts`, `availableBalance`, etc.

### 10. `/api/merchant/[merchantId]/finances/transactions` ✅
- **Statut:** ✅ DÉJÀ BON
- **Raison:** Réponses construites en camelCase
- **Champs:** `amountMinor`, `netAmount`, `createdAt`, etc.

### 11. `/api/merchant/[merchantId]/finances/payouts` ✅
- **Statut:** ✅ DÉJÀ BON
- **Raison:** Réponses construites en camelCase

### 12. `/api/merchant/[merchantId]/stats/impact` ✅
- **Statut:** ✅ DÉJÀ BON
- **Raison:** Réponses construites en camelCase
- **Champs:** `totalItemsSaved`, `totalCO2Saved`, `impactScore`, etc.

### 13. `/api/merchant/[merchantId]/settings` ✅
- **Statut:** ✅ DÉJÀ BON
- **Raison:** Accepte camelCase et convertit en snake_case pour Firestore

---

## 🎉 **TOUS LES ENDPOINTS SONT MAINTENANT ALIGNÉS !**

Tous les endpoints critiques ont été vérifiés et corrigés.

---

## ✅ **ACTIONS COMPLÉTÉES**

### ✅ Products endpoints
- Fonction `transformProductForFlutter()` créée
- GET `/products` et GET `/products/[productId]` corrigés

### ✅ Orders endpoints  
- Fonction `transformOrderForFlutter()` créée
- GET `/orders` et GET `/orders/[orderId]` corrigés
- PUT `/orders/[orderId]` vérifié (écrit en snake_case pour Firestore ✓)

### ✅ Reviews endpoint
- Fonction `transformReviewForFlutter()` créée
- GET `/reviews` corrigé
- POST `/reviews` (réponse) écrit en snake_case pour Firestore ✓

### ✅ Autres endpoints vérifiés
- [x] `/api/merchant/[merchantId]/finances/payouts` - DÉJÀ BON
- [x] `/api/merchant/[merchantId]/finances/summary` - DÉJÀ BON
- [x] `/api/merchant/[merchantId]/finances/transactions` - DÉJÀ BON
- [x] `/api/merchant/[merchantId]/stats/impact` - DÉJÀ BON
- [x] `/api/merchant/[merchantId]/stats/sales` - DÉJÀ BON
- [x] `/api/merchant/[merchantId]/customers` - DÉJÀ BON
- [x] `/api/merchant/[merchantId]/dashboard` - DÉJÀ BON
- [x] `/api/merchant/[merchantId]/settings` - DÉJÀ BON (accepte camelCase)
- [x] `/api/merchant/[merchantId]` (PUT/DELETE) - DÉJÀ BON (accepte camelCase)

---

## 🎯 **IMPACT**

### Risques si non corrigé:
1. ❌ Flutter ne pourra pas parser les données correctement
2. ❌ Les modèles Freezed génèreront des erreurs
3. ❌ Les champs seront `null` dans l'app Flutter
4. ❌ L'expérience utilisateur sera cassée

### Bénéfices après correction:
1. ✅ Compatibilité totale Flutter ↔️ API
2. ✅ Pas besoin de transformation côté Flutter
3. ✅ Code plus propre et maintenable
4. ✅ Moins de bugs liés au parsing

---

## 📝 **STANDARD À SUIVRE**

**Tous les endpoints API doivent:**
1. Retourner les données en **camelCase**
2. Inclure l'`id` dans les objets
3. Transformer les timestamps en ISO 8601 strings
4. Utiliser des fonctions de transformation réutilisables
5. Documenter les champs transformés

**Exemple de structure de transformation:**
```typescript
function transformEntityForFlutter(id: string, data: any) {
  return {
    id,
    // Champs requis
    field1: data.field1 || data.field_1,
    // Champs optionnels avec fallback
    field2: data.field2 || data.field_2 || null,
    // Booléens avec valeur par défaut
    isActive: data.isActive ?? data.is_active ?? false,
    // Timestamps
    createdAt: data.createdAt || data.created_at,
  };
}
```

