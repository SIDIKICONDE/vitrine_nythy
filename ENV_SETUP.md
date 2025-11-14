# Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine du projet avec le contenu suivant :

```env
# NextAuth Configuration
AUTH_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
# Pour le développement local
NEXTAUTH_URL=http://localhost:3000
# Pour la production Firebase Hosting (à utiliser dans les variables d'environnement Firebase)
# NEXTAUTH_URL=https://nythy-72973.firebaseapp.com

# Firebase App Check (reCAPTCHA v3)
# Site Key : Utilisée côté client pour initialiser App Check
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=6LdB3wssAAAAADPeDwitamQ0uBcUu0XMTMb3YhEL

# Secret Key : Stockée pour référence (non utilisée directement par App Check)
# Firebase App Check gère la vérification automatiquement
# Note: La Secret Key correspondante doit être récupérée depuis Google reCAPTCHA Admin
RECAPTCHA_V3_SECRET_KEY=your_recaptcha_secret_key_here

# Admin Credentials (Development only)
# Email: admin@nythy.com
# Password: admin123
```

## Générer une clé secrète

Pour générer une clé AUTH_SECRET sécurisée, exécutez :

```bash
openssl rand -base64 32
```

Ou utilisez :

```bash
npx auth secret
```

## Firebase App Check (reCAPTCHA Enterprise v3)

reCAPTCHA Enterprise v3 est utilisé pour Firebase App Check, qui protège votre application contre les abus.

**Note** : Vous utilisez reCAPTCHA Enterprise, qui offre des fonctionnalités avancées par rapport à la version standard.

### Clés reCAPTCHA

Vous avez deux clés reCAPTCHA :

1. **Site Key** (`NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY`) : 
   - Utilisée côté client pour initialiser Firebase App Check
   - Doit être publique (préfixe `NEXT_PUBLIC_`)
   - Valeur : `6LdB3wssAAAAADPeDwitamQ0uBcUu0XMTMb3YhEL`

2. **Secret Key** (`RECAPTCHA_V3_SECRET_KEY`) :
   - Stockée pour référence (non utilisée directement par App Check)
   - Firebase App Check gère la vérification automatiquement
   - Peut être utilisée pour des vérifications manuelles si nécessaire
   - Récupérez-la depuis [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)

### Configuration

1. ✅ Les clés reCAPTCHA sont déjà configurées dans ce fichier
2. Assurez-vous d'ajouter les deux variables dans votre fichier `.env.local`
3. Redémarrez le serveur de développement après avoir ajouté les variables

### Important

- **Site Key** : Obligatoire pour que App Check fonctionne
- **Secret Key** : Optionnelle (stockée pour référence, non utilisée par App Check)
- Firebase App Check gère automatiquement la vérification des jetons côté serveur

### Domaines configurés dans reCAPTCHA

Assurez-vous que les domaines suivants sont ajoutés dans votre configuration reCAPTCHA :

- `localhost` (développement local)
- `nythy-72973.firebaseapp.com` (Firebase Hosting - production)
- `nythy.com` (domaine personnalisé - si applicable)

### Vérification de la configuration reCAPTCHA

1. Allez sur [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Sélectionnez votre clé reCAPTCHA v3 (Site Key: `6LdB3wssAAAAADPeDwitamQ0uBcUu0XMTMb3YhEL`)
3. Vérifiez que le domaine `nythy-72973.firebaseapp.com` est bien dans la liste des domaines autorisés
4. Si ce n'est pas le cas, ajoutez-le et sauvegardez
5. Copiez la **Secret Key** correspondante et ajoutez-la dans `.env.local` comme `RECAPTCHA_V3_SECRET_KEY`

### reCAPTCHA Enterprise vs Standard

Vous utilisez **reCAPTCHA Enterprise**, qui offre :
- ✅ Fonctionnalités avancées de sécurité
- ✅ Meilleure protection contre les bots
- ✅ Analytics et rapports détaillés
- ✅ Support prioritaire

Le script Enterprise est automatiquement chargé dans le layout de l'application.

### Obtenir de nouvelles clés (si nécessaire)

1. Allez sur [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Créez une nouvelle clé **reCAPTCHA Enterprise v3**
3. Ajoutez vos domaines :
   - `localhost` (pour le développement)
   - `nythy-72973.firebaseapp.com` (pour Firebase Hosting)
   - `nythy.com` (si vous avez un domaine personnalisé)
4. Copiez les deux clés (Site Key et Secret Key) et ajoutez-les dans `.env.local`

## Identifiants de test

- **Email**: admin@nythy.com
- **Mot de passe**: admin123

⚠️ **Important**: Changez ces identifiants en production !

