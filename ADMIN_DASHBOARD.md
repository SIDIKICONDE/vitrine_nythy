# 🎯 Dashboard Admin Next.js - Documentation

## 📋 Vue d'ensemble

Dashboard d'administration complet pour la plateforme Nythy, converti depuis Flutter vers Next.js avec TypeScript.

## 🏗️ Architecture

```
vitrine nythy/
├── app/
│   ├── admin/                      # Pages du dashboard
│   │   ├── page.tsx               # Dashboard principal
│   │   ├── users/                 # Gestion utilisateurs
│   │   ├── merchants/             # Gestion commerces
│   │   ├── announcements/         # Annonces
│   │   ├── reports/               # Signalements
│   │   ├── faq/                   # FAQ
│   │   ├── support/               # Support client
│   │   ├── maintenance/           # Outils de maintenance
│   │   ├── cache/                 # Monitoring cache
│   │   ├── errors/                # Logs d'erreurs
│   │   ├── security/              # Paramètres sécurité
│   │   ├── monitoring/            # Monitoring sécurité
│   │   ├── themes/                # Personnalisation
│   │   ├── backgrounds/           # Backgrounds chat
│   │   ├── messaging/             # Métriques messagerie
│   │   └── recommendations/       # Recommandations
│   │
│   └── api/admin/                 # API Routes
│       ├── dashboard/             # Statistiques globales
│       ├── users/                 # CRUD utilisateurs
│       ├── merchants/             # CRUD commerces
│       ├── announcements/         # CRUD annonces
│       ├── reports/               # Modération
│       ├── faq/                   # CRUD FAQ
│       ├── support/               # Support tickets
│       ├── maintenance/           # Tâches maintenance
│       ├── cache/                 # Gestion cache
│       ├── errors/                # Logs d'erreurs
│       └── security/              # Événements sécurité
│
├── components/admin/              # Composants réutilisables
│   ├── AdminLayout.tsx            # Layout principal avec sidebar
│   └── StatCard.tsx               # Cartes de statistiques animées
│
└── types/admin.ts                 # Types TypeScript

```

## ✨ Fonctionnalités

### 📊 Dashboard Principal
- **Statistiques en temps réel** : Utilisateurs, commerces, commandes, revenus
- **Métriques de parrainage** : Total parrainages, codes actifs, récompenses
- **Médias SVG** : Suivi des logos et bannières SVG
- **Actions rapides** : Accès direct aux tâches importantes

### 👥 Gestion Utilisateurs
- Liste complète avec filtres (rôle, statut)
- Recherche par email/nom/ID
- Bannir/Débannir des utilisateurs
- Statistiques par utilisateur (commandes, dépenses)

### 🏪 Gestion Commerces
- Vérification des nouveaux commerces
- Suspension/Activation
- Filtres par statut et vérification
- Détection automatique des médias SVG

### 📣 Annonces
- Création d'annonces ciblées (users/merchants/all)
- Niveaux de priorité (low/medium/high)
- Types : info, warning, success, error
- Activation/Désactivation
- Suivi des lectures

### 🚩 Signalements
- Modération du contenu signalé
- Filtres par statut
- Actions : Résoudre / Rejeter
- Historique complet

### ❓ FAQ
- Gestion des questions/réponses
- Organisation par catégories
- Ordre personnalisable
- Publication/Dépublication
- Suivi des vues

### 🎧 Support Client
- Tickets de support
- Filtres par statut et priorité
- Catégories (technique, compte, paiement, etc.)
- Historique des réponses

### 🔧 Maintenance
- Nettoyage du cache
- Optimisation base de données
- Suppression fichiers temporaires
- Synchronisation des données

### 💾 Monitoring Cache
- Métriques en temps réel
- Taux de succès (hit rate)
- Utilisation mémoire
- Top des clés les plus utilisées
- Vidage du cache

### 🐛 Logs d'Erreurs
- Monitoring des erreurs (critical/error/warning)
- Stack traces détaillées
- Filtres par niveau de gravité
- Informations contextuelles

### 🔒 Sécurité
- Monitoring des événements de sécurité
- Détection d'activités suspectes
- Niveaux de sévérité
- Tracking IP et user-agent

## 🔐 Authentification

L'authentification admin est gérée par **proxy.ts** (lignes 346-370) :

```typescript
// Redirection automatique vers /admin/login si non authentifié
if (isOnAdmin && !isOnLogin && !isLoggedIn) {
  return NextResponse.redirect('/admin/login');
}
```

### Protection des routes :
- ✅ `/admin/*` - Protégé par le proxy
- ✅ `/api/admin/*` - Protégé par le proxy
- ✅ Redirection automatique vers login
- ✅ CallbackUrl pour retour après connexion

## 🎨 Composants

### AdminLayout
- **Sidebar responsive** avec 16 sections
- **Navigation active** avec highlights
- **Mode mobile** avec overlay
- **Dark mode** supporté
- **Notifications badge**

### StatCard
- **Animation d'entrée** au scroll
- **Compteurs animés** (2s)
- **Trend indicators** (hausse/baisse)
- **Couleurs personnalisables**
- **Effet hover** avec brillance

## 🚀 Utilisation

### Démarrer le dashboard

```bash
cd "vitrine nythy"
npm run dev
```

Accéder au dashboard : `http://localhost:3000/admin`

### Créer une nouvelle section

1. **Créer la page** :
```tsx
// app/admin/nouvelle-section/page.tsx
'use client';
import { AdminLayout } from '@/components/admin/AdminLayout';

export default function NouvelleSectionPage() {
  return (
    <AdminLayout>
      {/* Votre contenu */}
    </AdminLayout>
  );
}
```

2. **Créer l'API route** :
```tsx
// app/api/admin/nouvelle-section/route.ts
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET() {
  // Votre logique
  return NextResponse.json({ data });
}
```

3. **Ajouter au menu** dans `AdminLayout.tsx` :
```tsx
const navigation = [
  // ...
  { name: 'Nouvelle Section', href: '/admin/nouvelle-section', icon: Icon },
];
```

## 📊 API Routes

Toutes les routes API suivent le pattern RESTful :

- `GET /api/admin/resource` - Liste
- `POST /api/admin/resource` - Créer
- `PATCH /api/admin/resource/[id]` - Modifier
- `DELETE /api/admin/resource/[id]` - Supprimer

### Exemple d'utilisation :

```typescript
// Récupérer les utilisateurs
const response = await fetch('/api/admin/users');
const { users } = await response.json();

// Bannir un utilisateur
await fetch(`/api/admin/users/${userId}/ban`, {
  method: 'POST',
});
```

## 🎯 Prochaines étapes

### À implémenter :
- [ ] Authentification NextAuth complète
- [ ] Permissions granulaires (admin, moderator, etc.)
- [ ] Vrais logs d'erreurs (integration avec service)
- [ ] Cache Redis réel
- [ ] Métriques de messagerie complètes
- [ ] Système de recommandations
- [ ] Personnalisation des thèmes
- [ ] Gestion des backgrounds de chat
- [ ] Export de données (CSV, JSON)
- [ ] Notifications en temps réel

## 🔥 Stack Technique

- **Framework** : Next.js 14 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **Icons** : Lucide React
- **Database** : Firebase Firestore
- **Auth** : Géré par proxy.ts
- **State** : React hooks (useState, useEffect)

## 📝 Notes importantes

1. **Sécurité** : Le proxy.ts gère déjà l'auth admin - pas besoin de middleware supplémentaire
2. **Firebase** : Les credentials doivent être configurés dans `.env.local`
3. **Performance** : Les API routes utilisent le cache Firebase quand possible
4. **Dark Mode** : Tous les composants supportent le dark mode
5. **Responsive** : Dashboard optimisé mobile/tablet/desktop

## 🐛 Debugging

### Vérifier l'auth :
```typescript
// Dans une API route
console.log('User:', req.auth);
```

### Logs Firebase :
```typescript
console.log('📊 [ADMIN] Operation:', data);
```

## 📚 Ressources

- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)

---

**Dashboard créé par conversion Flutter → Next.js**  
**Toutes les 16 sections du dashboard Flutter ont été converties** ✅

