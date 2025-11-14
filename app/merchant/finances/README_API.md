# 💰 API Finances - Documentation

## ✅ État de la connexion

**LA PAGE FINANCES EST MAINTENANT CONNECTÉE À L'API FIREBASE !**

---

## 🔥 API Routes

### 1. **GET /api/merchant/[merchantId]/finances/summary**
Récupère le résumé financier d'un marchand pour une période donnée.

**Authentification:** ✅ Requise (NextAuth session)  
**Vérifications:** Propriétaire du commerce

**Query Parameters:**
- `period`: "daily" | "weekly" | "monthly" | "yearly" | "all" (défaut: "monthly")
- `startDate`: ISO date (optionnel)
- `endDate`: ISO date (optionnel)

**Response:**
```json
{
  "success": true,
  "summary": {
    "merchantId": "merchant123",
    "period": "monthly",
    "totalRevenue": {
      "amountMinor": 150000,
      "currencyCode": "EUR"
    },
    "totalOrders": 45,
    "averageOrderValue": {
      "amountMinor": 3333,
      "currencyCode": "EUR"
    },
    "totalPayouts": {
      "amountMinor": 120000,
      "currencyCode": "EUR"
    },
    "pendingPayouts": {
      "amountMinor": 15000,
      "currencyCode": "EUR"
    },
    "totalFees": {
      "amountMinor": 22500,
      "currencyCode": "EUR"
    },
    "totalCommissions": {
      "amountMinor": 22500,
      "currencyCode": "EUR"
    },
    "netRevenue": {
      "amountMinor": 127500,
      "currencyCode": "EUR"
    },
    "availableBalance": {
      "amountMinor": -7500,
      "currencyCode": "EUR"
    },
    "startDate": "2024-10-07T00:00:00.000Z",
    "endDate": "2024-11-07T10:00:00.000Z",
    "generatedAt": "2024-11-07T10:00:00.000Z",
    "revenueByDay": [
      {
        "date": "2024-11-01",
        "revenue": { "amountMinor": 5000, "currencyCode": "EUR" },
        "orders": 3
      }
    ],
    "nextPayoutDate": "2024-11-14T10:00:00.000Z"
  }
}
```

**Calculs effectués:**
- ✅ Revenus totaux (sum des commandes complétées)
- ✅ Commissions (15% des revenus)
- ✅ Revenus nets (revenus - commissions)
- ✅ Valeur moyenne des commandes
- ✅ Revenus par jour
- ✅ Prochaine date de versement (dans 7 jours)

---

### 2. **GET /api/merchant/[merchantId]/finances/transactions**
Récupère la liste des transactions financières.

**Authentification:** ✅ Requise  
**Vérifications:** Propriétaire du commerce

**Query Parameters:**
- `limit`: number (défaut: 50)
- `offset`: number (défaut: 0)
- `type`: "revenue" | "commission" | "payout" (optionnel)
- `status`: "pending" | "completed" | "failed" (optionnel)
- `startDate`: ISO date (optionnel)
- `endDate`: ISO date (optionnel)

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "order123",
      "merchantId": "merchant123",
      "orderId": "order123",
      "type": "revenue",
      "status": "completed",
      "amount": {
        "amountMinor": 5000,
        "currencyCode": "EUR"
      },
      "fee": {
        "amountMinor": 750,
        "currencyCode": "EUR"
      },
      "netAmount": {
        "amountMinor": 4250,
        "currencyCode": "EUR"
      },
      "description": "Commande #NYT-12345",
      "createdAt": "2024-11-07T10:00:00.000Z",
      "completedAt": "2024-11-07T12:00:00.000Z"
    }
  ],
  "total": 45
}
```

**Types de transactions:**
- `revenue` - Revenus des commandes
- `commission` - Commissions prélevées
- `payout` - Versements effectués

---

### 3. **GET /api/merchant/[merchantId]/finances/payouts**
Récupère l'historique des versements.

**Authentification:** ✅ Requise  
**Vérifications:** Propriétaire du commerce

**Query Parameters:**
- `limit`: number (défaut: 20)
- `offset`: number (défaut: 0)

**Response:**
```json
{
  "success": true,
  "payouts": [
    {
      "id": "payout_123",
      "merchantId": "merchant123",
      "type": "payout",
      "status": "completed",
      "amount": {
        "amountMinor": -50000,
        "currencyCode": "EUR"
      },
      "fee": {
        "amountMinor": 200,
        "currencyCode": "EUR"
      },
      "netAmount": {
        "amountMinor": -50200,
        "currencyCode": "EUR"
      },
      "description": "Versement hebdomadaire #1",
      "createdAt": "2024-11-07T10:00:00.000Z",
      "scheduledDate": "2024-11-07T10:00:00.000Z",
      "processedAt": "2024-11-07T12:00:00.000Z",
      "completedAt": "2024-11-07T14:00:00.000Z"
    }
  ],
  "total": 5
}
```

**Statuts des versements:**
- `pending` - En attente
- `processing` - En cours de traitement
- `completed` - Complété
- `failed` - Échoué

---

## 📄 Page Connectée

### ✅ `/merchant/finances/page.tsx` - Gestion des finances

**Architecture DDD complète:**
- ✅ **Use Cases:** GetFinanceSummaryUseCase, GetTransactionsUseCase, GetPayoutsUseCase
- ✅ **Repository:** ApiFinanceRepository (remplace MockFinanceRepository)
- ✅ **Entities:** FinanceSummary, Transaction
- ✅ **Value Objects:** Money
- ✅ **Hook:** useFinance (encapsule la logique métier)

**Connexions:**
- GET `/api/merchant/me` → Récupère le merchantId
- GET `/api/merchant/[merchantId]/finances/summary` → Résumé financier
- GET `/api/merchant/[merchantId]/finances/transactions` → Liste des transactions
- GET `/api/merchant/[merchantId]/finances/payouts` → Historique des versements

**Features:**
- ✅ Chargement depuis Firestore (basé sur les commandes)
- ✅ Filtres par période (jour, semaine, mois, année, tout)
- ✅ Calcul automatique des commissions (15%)
- ✅ Revenus nets calculés
- ✅ Graphique des revenus par jour
- ✅ Liste des transactions récentes
- ✅ Historique des versements
- ✅ Statistiques détaillées
- ✅ Affichage des erreurs
- ✅ Skeleton loading

---

## 📊 Structure des données

### Sources de données Firestore

**Collection `orders/`:**
```javascript
{
  id: "order123",
  merchantId: "merchant123",
  order_number: "#NYT-12345",
  total: 50.00,
  status: "completed",
  created_at: "2024-11-07T10:00:00.000Z",
  completed_at: "2024-11-07T12:00:00.000Z"
}
```

**Collection `payouts/` (optionnelle, sinon données fictives):**
```javascript
{
  id: "payout_123",
  merchantId: "merchant123",
  amount: 500.00,
  fee: 2.00,
  status: "completed",
  created_at: "2024-11-07T10:00:00.000Z",
  processed_at: "2024-11-07T12:00:00.000Z"
}
```

---

## 💡 Logique métier

### Calcul des commissions
```
Commission = Revenu × 15%
Revenu net = Revenu - Commission
```

### Calcul des versements
```
Versements = Revenus nets × pourcentage versé
En attente = Revenus nets × pourcentage en attente
Disponible = Revenus nets - Versements - En attente
```

### Périodes
- **Jour:** Dernières 24h
- **Semaine:** Derniers 7 jours
- **Mois:** Dernier mois
- **Année:** Dernière année
- **Tout:** Tout l'historique

---

## 🔐 Sécurité

### Authentification
- ✅ Toutes les routes nécessitent une session NextAuth
- ✅ Vérification du `userId` dans la session

### Autorisation
- ✅ Vérification que l'utilisateur est propriétaire du commerce
- ✅ Validation via `owner_user_id` ou `ownerUserId`

### Données sensibles
- ✅ Seul le propriétaire peut voir ses finances
- ✅ Pas d'exposition des données d'autres marchands

---

## 🎯 Normalisation des données

### API → Frontend (Money format)
```javascript
{
  amountMinor: 5000,     // En centimes
  currencyCode: "EUR"
}
// Converti en Money Value Object côté frontend
```

### Timestamps
- **Format API:** ISO 8601 string
- **Format Frontend:** Date object
- **Timezone:** UTC

---

## 🚀 Prochaines étapes

### À implémenter :
- [ ] Collection dédiée `payouts` dans Firestore
- [ ] Processus automatique de versements hebdomadaires
- [ ] Gestion des remboursements
- [ ] Export CSV des transactions
- [ ] Graphiques avancés (revenus mensuels, commissions)
- [ ] Notifications avant chaque versement
- [ ] Historique détaillé par commande
- [ ] Filtres avancés (par type, statut, montant)
- [ ] Recherche de transactions
- [ ] Téléchargement de factures

---

## 📝 Notes importantes

1. **Commissions:** Actuellement fixées à 15% - à rendre configurable
2. **Versements:** Actuellement données fictives - nécessite collection `payouts`
3. **Calculs:** Basés sur les commandes `completed` uniquement
4. **Format:** Prix toujours en centimes (amountMinor)
5. **Timezone:** Toutes les dates en UTC
6. **Périodes:** Calculées côté serveur pour cohérence

---

## ⚠️ Important

**La page finances utilise maintenant l'architecture DDD complète** avec séparation nette entre :
- **Présentation** (page.tsx, components)
- **Application** (hooks/useFinance.ts)
- **Domaine** (entities, use cases, repositories)
- **Infrastructure** (ApiFinanceRepository)

Cela garantit :
- ✅ Testabilité maximale
- ✅ Maintenabilité du code
- ✅ Évolutivité facile
- ✅ Séparation des responsabilités

---

**Dernière mise à jour :** 7 novembre 2024  
**Statut :** ✅ Page connectée et fonctionnelle avec architecture DDD

