# 🚀 Installation Rapide - Fonctions Stripe

## Étape 1 : Installer les dépendances

```bash
cd firebase/functions
npm install
```

## Étape 2 : Configurer les clés Stripe

Créer un fichier `.env` :

```bash
cp .env.example .env
```

Éditer `.env` avec vos clés Stripe de test :
- Aller sur https://dashboard.stripe.com/test/apikeys
- Copier la **Publishable key** et la **Secret key**

## Étape 3 : Compiler le TypeScript

```bash
npm run build
```

Cela va compiler le code TypeScript dans le dossier `lib/`.

## Étape 4 : Activer les fonctions Stripe dans index.js

Éditer `index.js` et décommenter les lignes :

```javascript
const stripeAPI = require('./lib/index');
exports.stripeAPI = stripeAPI.api;
```

## Étape 5 : Déployer

```bash
npm run deploy
```

ou localement pour tester :

```bash
npm run serve
```

## 📝 Configuration Flutter

Mettre à jour `lib/core/config/stripe_config.dart` avec votre clé publique Stripe.

## ✅ Vérification

Une fois déployé, tester avec :

```bash
curl https://YOUR_FUNCTION_URL/api/health
```

Vous devriez voir : `{"status":"ok"}`

## 📚 Documentation complète

Voir `STRIPE_README.md` pour plus de détails sur :
- Configuration des webhooks
- Tests avec cartes de test
- Gestion des erreurs
- Monitoring

## ⚠️ Important

- ✅ Les fonctions Stripe sont dans `src/`
- ✅ Compilées dans `lib/` après `npm run build`
- ✅ Les anciennes fonctions JS restent intactes
- ✅ Tout est compatible et coexiste
