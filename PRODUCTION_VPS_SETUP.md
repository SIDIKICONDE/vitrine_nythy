# 🚀 Guide de Déploiement VPS Production

## 📋 Erreurs Identifiées et Solutions

### ❌ Erreur 1 : AUTH_SECRET manquant

```
[auth][error] MissingSecret: Please define a `secret`. Read more at https://errors.authjs.dev#missingsecret
```

**Cause** : La variable d'environnement `AUTH_SECRET` n'est pas définie sur le serveur VPS.

**Solution** : Configurer les variables d'environnement sur le serveur.

### ❌ Erreur 2 : geoip-lite - Chemin incorrect

```
Error: ENOENT: no such file or directory, open '/ROOT/node_modules/geoip-lite/data/geoip-country.dat'
```

**Cause** : Le chemin des données geoip-lite est incorrect (utilise `/ROOT/` au lieu du chemin réel).

**Solution** : Installer correctement les dépendances et gérer les erreurs de manière plus robuste.

---

## 🔧 Configuration du Serveur VPS

### Étape 1 : Configurer les Variables d'Environnement

Sur votre serveur VPS, créez ou éditez le fichier `.env.production` :

```bash
cd /var/www/vitrine_nythy
nano .env.production
```

Ajoutez les variables suivantes :

```env
# =============================================================================
# NYTHY PRODUCTION ENVIRONMENT
# =============================================================================

# -----------------------------------------------------------------------------
# NextAuth Configuration (CRITIQUE)
# -----------------------------------------------------------------------------
AUTH_SECRET=VOTRE_CLE_SECRETE_32_CHARS_MINIMUM_ICI
NEXTAUTH_URL=https://votre-domaine.com

# -----------------------------------------------------------------------------
# Firebase Configuration
# -----------------------------------------------------------------------------
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=nythy-72973.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=nythy-72973
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=nythy-72973.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=000000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:000000000000:web:xxxxxxxxxxxxxxxx

# Firebase Admin (Backend)
FIREBASE_PROJECT_ID=nythy-72973
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@nythy-72973.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nVOTRE_CLE_PRIVEE_ICI\n-----END PRIVATE KEY-----\n"

# -----------------------------------------------------------------------------
# reCAPTCHA (App Check)
# -----------------------------------------------------------------------------
NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY=6LdB3wssAAAAADPeDwitamQ0uBcUu0XMTMb3YhEL
RECAPTCHA_V3_SECRET_KEY=VOTRE_SECRET_KEY_RECAPTCHA

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------
NODE_ENV=production

# -----------------------------------------------------------------------------
# Optional: IP Intelligence
# -----------------------------------------------------------------------------
# VPNAPI_KEY=votre_cle_api_vpn (optionnel)
```

### Étape 2 : Générer AUTH_SECRET Sécurisé

```bash
# Méthode 1 : OpenSSL
openssl rand -base64 32

# Méthode 2 : Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Méthode 3 : NextAuth CLI
npx auth secret
```

Copiez la clé générée et remplacez `VOTRE_CLE_SECRETE_32_CHARS_MINIMUM_ICI` dans le fichier `.env.production`.

### Étape 3 : Configurer PM2 avec les Variables d'Environnement

Créez un fichier `ecosystem.config.js` :

```bash
cd /var/www/vitrine_nythy
nano ecosystem.config.js
```

Contenu :

```javascript
module.exports = {
  apps: [{
    name: 'vitrine_nythy',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3000',
    cwd: '/var/www/vitrine_nythy',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Charger les variables depuis le fichier .env.production
    env_file: '.env.production',
    error_file: '/root/.pm2/logs/vitrine-nythy-error.log',
    out_file: '/root/.pm2/logs/vitrine-nythy-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }]
};
```

### Étape 4 : Réinstaller les Dépendances Correctement

```bash
cd /var/www/vitrine_nythy

# Nettoyer complètement
rm -rf node_modules package-lock.json .next

# Réinstaller les dépendances
npm install --production=false

# Vérifier que geoip-lite est bien installé
ls -la node_modules/geoip-lite/data/

# Rebuild si nécessaire
npm rebuild geoip-lite
```

### Étape 5 : Rebuild de l'Application

```bash
cd /var/www/vitrine_nythy

# Type checking
npm run type-check

# Build production
npm run build

# Vérifier que le build est réussi
ls -la .next/
```

### Étape 6 : Redémarrer PM2

```bash
# Arrêter l'application
pm2 stop vitrine_nythy

# Supprimer l'ancienne configuration
pm2 delete vitrine_nythy

# Démarrer avec la nouvelle configuration
pm2 start ecosystem.config.js --env production

# Sauvegarder la configuration PM2
pm2 save

# Vérifier les logs
pm2 logs vitrine_nythy --lines 50
```

---

## 🔍 Vérification Post-Déploiement

### 1. Vérifier les Variables d'Environnement

```bash
# Sur le serveur VPS
pm2 env 0  # 0 est l'ID du processus
```

### 2. Vérifier les Logs

```bash
# Logs en temps réel
pm2 logs vitrine_nythy

# Erreurs uniquement
pm2 logs vitrine_nythy --err

# 100 dernières lignes
pm2 logs vitrine_nythy --lines 100
```

### 3. Tester l'Application

```bash
# Test local sur le serveur
curl -I http://localhost:3000

# Test depuis l'extérieur
curl -I https://votre-domaine.com
```

### 4. Vérifier les Métriques PM2

```bash
pm2 monit
```

---

## 🛠️ Commandes de Maintenance

### Redéploiement Complet

```bash
cd /var/www/vitrine_nythy

# Pull les derniers changements
git pull origin main

# Réinstaller les dépendances si nécessaire
npm install

# Rebuild
npm run build

# Redémarrer PM2
pm2 restart vitrine_nythy

# Vérifier
pm2 logs vitrine_nythy --lines 20
```

### Vider les Logs

```bash
pm2 flush vitrine_nythy
```

### Monitoring

```bash
# Dashboard en temps réel
pm2 monit

# Statistiques
pm2 status

# Détails d'un processus
pm2 show vitrine_nythy
```

---

## 📊 Checklist de Vérification

- [ ] ✅ AUTH_SECRET généré et configuré (minimum 32 caractères)
- [ ] ✅ Toutes les variables Firebase configurées
- [ ] ✅ `.env.production` créé avec les bonnes valeurs
- [ ] ✅ `node_modules` réinstallé proprement
- [ ] ✅ `geoip-lite/data/` existe et contient les fichiers `.dat`
- [ ] ✅ Build production réussi (`.next/` contient les fichiers)
- [ ] ✅ PM2 configuré avec `ecosystem.config.js`
- [ ] ✅ Application démarre sans erreur `AUTH_SECRET`
- [ ] ✅ Application démarre sans erreur `geoip-lite`
- [ ] ✅ Logs PM2 ne montrent plus d'erreurs critiques
- [ ] ✅ L'application est accessible via le domaine

---

## 🚨 Dépannage

### L'erreur AUTH_SECRET persiste

```bash
# Vérifier que la variable est bien chargée
pm2 env 0 | grep AUTH_SECRET

# Si vide, forcer le rechargement
pm2 restart vitrine_nythy --update-env

# Ou redémarrer complètement
pm2 delete vitrine_nythy
pm2 start ecosystem.config.js --env production
```

### L'erreur geoip-lite persiste

```bash
# Vérifier l'installation
cd /var/www/vitrine_nythy
ls -la node_modules/geoip-lite/data/

# Si les fichiers sont manquants
npm rebuild geoip-lite

# Ou réinstaller complètement
npm uninstall geoip-lite
npm install geoip-lite

# Vérifier à nouveau
ls -la node_modules/geoip-lite/data/
```

### High Error Rate Alert

Cette alerte apparaît quand les erreurs ci-dessus se produisent. Une fois corrigées, l'alerte disparaîtra.

---

## 📝 Notes Importantes

1. **Ne JAMAIS commiter `.env.production`** dans Git
2. **Sauvegarder AUTH_SECRET** dans un gestionnaire de mots de passe sécurisé
3. **Surveiller les logs** régulièrement avec `pm2 logs`
4. **Configurer des alertes** PM2 pour être notifié des crashs
5. **Faire des backups** réguliers de la configuration

---

## 📞 Support

Si les problèmes persistent :

1. Vérifier les logs complets : `pm2 logs vitrine_nythy --lines 200`
2. Vérifier l'état du processus : `pm2 show vitrine_nythy`
3. Vérifier les ressources système : `htop` ou `pm2 monit`
4. Consulter la documentation NextAuth : https://authjs.dev/getting-started/deployment

