# 🛒 API Orders - Documentation

## ✅ État de la connexion

**LA PAGE ORDERS EST MAINTENANT CONNECTÉE À L'API FIREBASE !**

---

## 🔥 API Routes

### 1. **GET /api/merchant/[merchantId]/orders**
Récupère toutes les commandes d'un marchand.

**Authentification:** ✅ Requise (NextAuth session)  
**Vérifications:** Propriétaire du commerce

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "order123",
      "order_number": "#NYT-12345",
      "customer_name": "Marie Dupont",
      "merchantId": "merchant123",
      "items": [
        {
          "productName": "Panier surprise",
          "quantity": 2,
          "price": 5.00
        }
      ],
      "total": 10.00,
      "status": "pending",
      "pickup_time": "2024-11-07T18:00:00Z",
      "created_at": "2024-11-07T16:00:00Z",
      "updated_at": "2024-11-07T16:00:00Z"
    }
  ]
}
```

---

### 2. **GET /api/merchant/[merchantId]/orders/[orderId]**
Récupère une commande spécifique.

**Authentification:** ✅ Requise  
**Vérifications:** Propriétaire du commerce + Commande appartient au marchand

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order123",
    "order_number": "#NYT-12345",
    "customer_name": "Marie Dupont",
    "items": [...],
    "total": 10.00,
    "status": "pending",
    ...
  }
}
```

---

### 3. **PUT /api/merchant/[merchantId]/orders/[orderId]**
Met à jour le statut d'une commande.

**Authentification:** ✅ Requise  
**Vérifications:** Propriétaire du commerce + Commande appartient au marchand

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Statuts valides:**
- `pending` - En attente
- `confirmed` - Confirmée
- `ready` - Prête pour le retrait
- `completed` - Récupérée/Terminée
- `cancelled` - Annulée

**Response:**
```json
{
  "success": true,
  "message": "Commande mise à jour avec succès"
}
```

**Fonctionnalités:**
- ✅ Validation du statut
- ✅ Timestamps automatiques (confirmed_at, ready_at, completed_at, cancelled_at)
- ✅ Raison d'annulation optionnelle

---

## 📄 Page Connectée

### ✅ `/merchant/orders/page.tsx` - Gestion des commandes
**Connexions:**
- GET `/api/merchant/me` → Récupère le merchantId
- GET `/api/merchant/[merchantId]/orders` → Charge toutes les commandes
- PUT `/api/merchant/[merchantId]/orders/[orderId]` → Change le statut

**Features:**
- ✅ Chargement des commandes depuis Firestore
- ✅ Filtres (Toutes, En cours, Prêtes, Terminées)
- ✅ Changement de statut en temps réel
- ✅ Affichage compact avec informations essentielles
- ✅ Actions selon le statut actuel :
  - `pending` → Confirmer ou Annuler
  - `confirmed` → Marquer comme Prête
  - `ready` → Marquer comme Récupérée (completed)
- ✅ Affichage des erreurs
- ✅ Skeleton loading
- ✅ Formatage automatique des dates/heures

---

## 📊 Structure Firestore

```
orders/
  {orderId}/
    - order_number: string (ex: "#NYT-12345")
    - merchantId: string
    - customer_name: string
    - customer_id: string?
    - items: array
      - productName: string
      - productId: string?
      - quantity: number
      - price: number
    - total: number
    - status: "pending" | "confirmed" | "ready" | "completed" | "cancelled"
    - pickup_time: ISO timestamp
    - created_at: ISO timestamp
    - updated_at: ISO timestamp
    - confirmed_at: ISO timestamp?
    - ready_at: ISO timestamp?
    - completed_at: ISO timestamp?
    - cancelled_at: ISO timestamp?
    - cancellation_reason: string?
```

---

## 🎯 Flux de statuts

### Flux normal d'une commande :
```
pending (Client passe commande)
   ↓
confirmed (Marchand confirme)
   ↓
ready (Marchand prépare la commande)
   ↓
completed (Client récupère)
```

### Flux d'annulation :
```
pending → cancelled (Marchand ou client annule)
confirmed → cancelled (Marchand ou client annule)
```

---

## 🎨 Interface utilisateur

### Badges de statut :
- ⏳ **En attente** (jaune) - Nouvelle commande
- ✅ **Confirmée** (bleu) - En préparation
- 📦 **Prête** (vert) - Attend le client
- ✔️ **Terminée** (gris) - Récupérée
- ❌ **Annulée** (rouge) - Annulée

### Filtres :
- **Toutes** - Affiche toutes les commandes
- **En cours** - pending + confirmed
- **Prêtes** - ready
- **Terminées** - completed + cancelled

### Affichage compact :
- Numéro de commande + Statut + Heure de création
- Nom du client + Nombre d'articles
- Heure de retrait prévue
- Montant total
- Actions rapides selon le statut

---

## 🔐 Sécurité

### Authentification
- ✅ Toutes les routes nécessitent une session NextAuth
- ✅ Vérification du `userId` dans la session

### Autorisation
- ✅ Vérification que l'utilisateur est propriétaire du commerce
- ✅ Vérification que la commande appartient bien au marchand
- ✅ Validation du statut avant mise à jour

### Validation
- ✅ Validation côté serveur (statuts valides)
- ✅ Vérification d'existence (merchant, order)
- ✅ Gestion des erreurs appropriées

---

## 🎯 Normalisation des données

### Frontend → API (camelCase → snake_case)
```typescript
{
  orderNumber → order_number
  customerName → customer_name
  customerId → customer_id
  pickupTime → pickup_time
  createdAt → created_at
  updatedAt → updated_at
  confirmedAt → confirmed_at
  readyAt → ready_at
  completedAt → completed_at
  cancelledAt → cancelled_at
  cancellationReason → cancellation_reason
}
```

### API → Frontend (snake_case → camelCase)
Inversement des conversions ci-dessus.

---

## 🚀 Prochaines étapes

### À implémenter :
- [ ] GET avec filtres (status, date range, customer)
- [ ] GET avec pagination
- [ ] Statistiques des commandes (revenus, nombre par période)
- [ ] Notifications push lors de nouvelle commande
- [ ] Notifications push pour le client (statut changé)
- [ ] Historique des commandes par client
- [ ] Export CSV des commandes
- [ ] Recherche par numéro de commande
- [ ] Gestion des remboursements
- [ ] Notes/commentaires sur les commandes

---

## 📝 Notes importantes

1. **Timestamps :** Format ISO 8601 (UTC)
2. **Numéro de commande :** Format `#NYT-XXXXX` (auto-généré)
3. **Total :** En euros (décimal)
4. **Horaires :** Fuseau horaire Europe/Paris
5. **Statuts :** Transitions validées côté serveur
6. **Collection :** `orders` à la racine (pas sous-collection)
7. **Index Firestore :** `merchantId` + `created_at` pour tri

---

## ⚠️ Important

**Les commandes sont stockées dans une collection `orders` à la racine de Firestore**, pas dans une sous-collection sous `merchants`. Cela permet :
- ✅ Requêtes plus performantes
- ✅ Scalabilité optimale
- ✅ Partage facile entre marchands (commandes groupées)
- ✅ Indexation et requêtes complexes simplifiées

Pour créer l'index Firestore nécessaire :
```
Collection: orders
Fields indexed: merchantId (Ascending) + created_at (Descending)
Query scope: Collection
```

---

**Dernière mise à jour :** 7 novembre 2024  
**Statut :** ✅ Page connectée et fonctionnelle

