# Vitrine - Application Web Moderne

Une application web moderne construite avec les dernières technologies web.

## 🚀 Technologies

- **Next.js 14** - Framework React pour la production
- **React 19** - Bibliothèque UI
- **TypeScript** - Typage statique
- **Tailwind CSS v4** - Framework CSS utilitaire moderne
- **ESLint** - Linter pour code propre

## 📦 Installation

Les dépendances sont déjà installées. Si vous devez les réinstaller :

```bash
npm install
```

## 🛠️ Développement

Lancez le serveur de développement :

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🏗️ Build

Pour créer une version de production :

```bash
npm run build
```

Pour démarrer le serveur de production :

```bash
npm start
```

## 📝 Structure du Projet

```
vitrine nyth/
├── app/
│   ├── layout.tsx      # Layout principal
│   ├── page.tsx        # Page d'accueil
│   └── globals.css     # Styles globaux
├── components/         # Composants React
│   ├── layout/        # Composants de mise en page
│   ├── Header.tsx     # En-tête du site
│   ├── Footer.tsx     # Pied de page professionnel
│   └── ...            # Autres composants
├── lib/               # Utilitaires et constants
├── types/             # Types TypeScript
├── public/            # Fichiers statiques
├── package.json       # Dépendances
└── README.md         # Documentation
```

## ✨ Fonctionnalités

- 🎨 Design moderne avec dégradés et effets glassmorphism
- 📱 Responsive sur tous les appareils
- ⚡ Performance optimisée
- 🌙 Prêt pour le mode sombre (si activé)
- 🔧 Facile à personnaliser

## 🎨 Personnalisation

### Modifier les couleurs

Éditez `app/page.tsx` et changez les classes Tailwind CSS :
- `from-slate-900 via-purple-900 to-slate-900` pour le dégradé de fond
- `from-purple-500 to-pink-500` pour les boutons

### Ajouter des pages

Créez de nouveaux fichiers dans le dossier `app/` :
```bash
app/
├── about/
│   └── page.tsx
├── contact/
│   └── page.tsx
```

## 📚 Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Contribution

N'hésitez pas à personnaliser cette application selon vos besoins !

---

Créé avec ❤️ par votre équipe
