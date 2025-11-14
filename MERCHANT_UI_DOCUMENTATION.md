# Documentation UI Marchand

## 📋 Vue d'ensemble

Interface utilisateur complète pour le domaine marchand (commerçants anti-gaspillage), développée en React/Next.js avec une architecture modulaire et réutilisable.

---

## 🎨 Composants créés

### 1. Composants de base

#### `MerchantCard.tsx`
Carte d'affichage d'un marchand avec :
- 🖼️ Bannière et logo
- ⭐ Note moyenne et nombre d'avis
- 📍 Distance (optionnelle)
- 🌱 Impact CO₂
- 📦 Nombre de produits disponibles

**Props :**
```typescript
interface MerchantCardProps {
  merchant: Merchant;
  showDistance?: boolean;
}
```

#### `ProductCard.tsx`
Carte produit anti-gaspillage avec :
- 🏷️ Badge de réduction
- 🎁 Indicateur panier surprise
- ⏰ Horaires de retrait
- 🌱 Impact environnemental (CO₂, poids)
- 🏷️ Tags diététiques

**Props :**
```typescript
interface ProductCardProps {
  product: Product;
  merchantName?: string;
  showMerchant?: boolean;
}
```

#### `MerchantStats.tsx`
Grille de statistiques avec 8 indicateurs :
- 📦 Commandes
- 💰 Chiffre d'affaires
- ⭐ Note moyenne
- 👥 Abonnés
- 🍽️ Produits actifs
- 🛟 Produits sauvés
- 🌱 Impact CO₂
- 📊 Taux de conversion

**Props :**
```typescript
interface MerchantStatsProps {
  stats: MerchantStats;
  trends?: {
    orders?: number;
    revenue?: number;
    followers?: number;
  };
}
```

#### `MerchantList.tsx`
Liste de marchands avec filtres :
- 🔍 Recherche par nom
- 📂 Filtre par type de commerce
- 📱 Responsive (grille 1/2/3 colonnes)

---

### 2. Composants Dashboard

#### `DashboardStats.tsx`
Wrapper pour les statistiques du dashboard avec :
- 🔄 Chargement asynchrone
- ⚡ États de chargement (skeleton)
- 📊 Affichage des tendances

#### `QuickActions.tsx`
Actions rapides avec 6 raccourcis :
- ➕ Nouveau produit
- 📦 Mes produits
- 🛒 Commandes
- 📊 Statistiques
- ⚙️ Profil
- 🔧 Paramètres

#### `RecentOrders.tsx`
Liste des commandes récentes avec :
- 🔔 Statuts colorés (en attente, confirmée, prête, terminée, annulée)
- ⏰ Horodatage relatif
- 💰 Montant total
- 👤 Nom du client

#### `ActivityFeed.tsx`
Flux d'activité en temps réel :
- 🛒 Nouvelles commandes
- ⭐ Nouveaux avis
- 👥 Nouveaux abonnés
- 📦 Produits épuisés

#### `PerformanceChart.tsx`
Graphique de performance des ventes :
- 📈 Graphique en barres interactif
- 📅 3 périodes : Semaine / Mois / Année
- 🎨 Design moderne avec gradients

#### `TopProducts.tsx`
Top 5 des produits les plus vendus :
- 🏆 Classement numéroté
- 💰 Chiffre d'affaires généré
- ⭐ Note moyenne
- 📦 Nombre de ventes

---

### 3. Composants Produits

#### `ProductForm.tsx`
Formulaire complet de création/édition de produit :

**Sections :**
1. **Informations de base**
   - Titre, description
   - Option panier surprise

2. **Prix et disponibilité**
   - Prix original / réduit
   - Quantité disponible
   - Calcul automatique de réduction

3. **Horaires de retrait**
   - Date/heure début et fin
   - Instructions de retrait

4. **Informations diététiques**
   - Tags diététiques (végétarien, vegan, etc.)

5. **Impact environnemental**
   - Poids en grammes
   - CO₂ économisé

**Validation :**
- ✅ Titre requis
- ✅ Prix réduit < prix original
- ✅ Quantité positive

#### `ProductList.tsx`
Liste des produits du marchand :
- 🔍 Recherche par titre
- 🎛️ Filtres : Tous / Disponibles / Épuisés
- ⚡ Actions rapides : Modifier, Activer/Désactiver, Supprimer
- 📱 Grille responsive

---

## 📄 Pages créées

### 1. Dashboard

**Route :** `/merchant/dashboard`

**Composants inclus :**
- 📊 Statistiques clés (8 indicateurs)
- ⚡ Actions rapides (6 raccourcis)
- 📈 Graphique de performance
- 🏆 Top 5 produits
- 🛒 Commandes récentes
- 🔔 Flux d'activité
- 💡 Conseil du jour

**Layout :**
```
┌─────────────────────────────────────┐
│ Header + Date                        │
├─────────────────────────────────────┤
│ Actions rapides (grille 3 colonnes) │
├─────────────────────────────────────┤
│ Statistiques (grille 4 colonnes)    │
├──────────────────┬──────────────────┤
│ Graphique perfs  │ Top produits     │
├──────────────────┴──────┬───────────┤
│ Commandes récentes      │ Activité  │
└─────────────────────────┴───────────┘
```

### 2. Gestion des produits

#### `/merchant/products`
- Liste complète des produits
- Filtres et recherche
- Actions : Modifier, Activer/Désactiver, Supprimer

#### `/merchant/products/new`
- Formulaire de création
- Validation en temps réel
- Prévisualisation des réductions

#### `/merchant/products/[id]/edit`
- Formulaire d'édition
- Pré-remplissage des données
- Même validation que la création

### 3. Profil marchand

#### `/merchant/profile`
- Informations générales
- Bannière et logo
- Contact et adresse
- Mode édition inline

---

## 🎨 Design System

### Composants UI réutilisés

```css
/* Classes Tailwind personnalisées */
.liquid-glass          /* Effet verre liquide */
.shadow-custom-xl      /* Ombre personnalisée */
.text-foreground       /* Texte principal */
.text-foreground-muted /* Texte secondaire */
.bg-surface            /* Fond surface */
.bg-surface-hover      /* Fond hover */
.border-border         /* Bordure */
```

### Couleurs principales

- **Primary** : Actions principales, CTA
- **Secondary** : Actions secondaires, accents
- **Success** : États positifs (disponible, confirmé)
- **Warning** : Alertes (stock faible)
- **Error** : Erreurs, suppressions
- **Surface** : Arrière-plans de cartes

### Responsive Breakpoints

```typescript
// Tailwind breakpoints
sm: 640px   // Mobile large
md: 768px   // Tablette
lg: 1024px  // Desktop
xl: 1280px  // Desktop large
```

---

## 🔄 États de chargement

Tous les composants async incluent :
- ⏳ Skeleton loading (animation pulse)
- ❌ Gestion d'erreurs
- 🔄 États vides avec messages informatifs

**Exemple :**
```typescript
if (loading) {
  return <Skeleton />;
}

if (error) {
  return <ErrorMessage />;
}

if (data.length === 0) {
  return <EmptyState />;
}
```

---

## 📱 Responsive Design

### Grilles adaptatives

```typescript
// Composants stats
grid-cols-1 md:grid-cols-2 lg:grid-cols-4

// Produits
grid-cols-1 md:grid-cols-2 lg:grid-cols-3

// Dashboard charts
grid-cols-1 lg:grid-cols-2

// Activity section
grid-cols-1 lg:grid-cols-3
```

### Navigation mobile
- Menu hamburger (à implémenter)
- Bottom navigation (optionnelle)
- Touch-friendly (44px minimum)

---

## 🚀 Optimisations

### Performance
- ✅ Lazy loading des composants (Suspense)
- ✅ Pagination des listes
- ✅ Debounce sur recherche
- ✅ Images optimisées (Next.js Image)

### SEO
- ✅ Metadata configurée
- ✅ Structure sémantique HTML
- ✅ Alt text sur images

### Accessibilité
- ✅ Contraste WCAG AA
- ✅ Focus visible
- ✅ Labels sur inputs
- ⚠️ Navigation clavier (à améliorer)
- ⚠️ ARIA labels (à compléter)

---

## 🔮 Prochaines étapes

### Court terme
1. **Authentification**
   - Formulaires login/register
   - Gestion de session
   - Protected routes

2. **API Integration**
   - Connexion aux endpoints Firebase
   - Gestion des erreurs réseau
   - Cache et invalidation

3. **Upload d'images**
   - Drag & drop
   - Preview
   - Compression automatique

### Moyen terme
1. **Notifications**
   - Toast notifications
   - Push notifications
   - Email notifications

2. **Analytics**
   - Graphiques avancés (Chart.js/Recharts)
   - Exports PDF
   - Rapports personnalisés

3. **Messages**
   - Chat avec clients
   - Notifications temps réel
   - Historique conversations

### Long terme
1. **Multi-langue**
   - i18n avec next-intl
   - Détection automatique
   - Traductions complètes

2. **Thème sombre**
   - Toggle light/dark
   - Persistance préférence
   - Transitions fluides

3. **PWA**
   - Service worker
   - Offline mode
   - Installation native

---

## 📦 Structure des fichiers

```
components/merchant/
├── MerchantCard.tsx          # Carte marchand
├── MerchantList.tsx          # Liste marchands
├── MerchantStats.tsx         # Statistiques
├── ProductCard.tsx           # Carte produit
├── index.ts                  # Export centralisé
├── dashboard/
│   ├── DashboardStats.tsx    # Stats dashboard
│   ├── QuickActions.tsx      # Actions rapides
│   ├── RecentOrders.tsx      # Commandes récentes
│   ├── ActivityFeed.tsx      # Flux d'activité
│   ├── PerformanceChart.tsx  # Graphique performance
│   └── TopProducts.tsx       # Top produits
└── products/
    ├── ProductForm.tsx       # Formulaire produit
    └── ProductList.tsx       # Liste produits

app/merchant/
├── dashboard/
│   ├── page.tsx              # Page dashboard
│   └── loading.tsx           # Loading state
├── products/
│   ├── page.tsx              # Liste produits
│   ├── new/
│   │   └── page.tsx          # Nouveau produit
│   └── [id]/
│       └── edit/
│           └── page.tsx      # Édition produit
├── profile/
│   └── page.tsx              # Profil marchand
├── layout.tsx                # Layout marchand
└── page.tsx                  # Redirection
```

---

## 🎯 Résumé

### Composants créés : 17
- Composants de base : 4
- Composants dashboard : 6
- Composants produits : 2
- Composants auth : 0 (annulés)
- Pages : 5

### Lignes de code : ~3000+
### Technologies : React, Next.js 14, TypeScript, Tailwind CSS

### Architecture : ✅
- DDD (Domain-Driven Design)
- Composants réutilisables
- TypeScript strict
- Separation of concerns

### État d'avancement : 80%
- ✅ Dashboard complet
- ✅ Gestion produits
- ✅ Statistiques
- ⚠️ Authentification (à compléter)
- ⚠️ API integration (à faire)
- ⚠️ Upload images (à faire)

---

## 👨‍💻 Développement

### Installation
```bash
npm install
```

### Développement
```bash
npm run dev
```

### Build
```bash
npm run build
```

### Tests
```bash
npm test
```

---

**Auteur :** Assistant IA  
**Date :** 7 novembre 2025  
**Version :** 1.0.0  
**Statut :** ✅ Dashboard complet

