# ✅ Checklist de Déploiement Production - Nythy

## 📋 Pré-Déploiement

### Configuration Environnement

- [ ] **Variables d'environnement configurées**
  - [ ] `AUTH_SECRET` généré (min 32 caractères)
  - [ ] `NEXTAUTH_URL` pointe vers l'URL de production
  - [ ] Toutes les variables `NEXT_PUBLIC_FIREBASE_*` configurées
  - [ ] `FIREBASE_PRIVATE_KEY` et `FIREBASE_CLIENT_EMAIL` configurés
  - [ ] `RECAPTCHA_V3_SECRET_KEY` configuré
  - [ ] `NEXT_PUBLIC_ALLOWED_ORIGINS` liste les domaines de production

### Firebase Configuration

- [ ] **Firebase Project configuré**
  - [ ] Project ID vérifié: `nythy-72973`
  - [ ] Billing activé (plan Blaze pour Cloud Functions)
  - [ ] Service account créé et téléchargé
  - [ ] App Check activé
  - [ ] reCAPTCHA Enterprise configuré

- [ ] **Domaines autorisés dans Firebase Auth**
  - [ ] `nythy-72973.firebaseapp.com`
  - [ ] Domaine personnalisé (si applicable)

- [ ] **reCAPTCHA Admin**
  - [ ] Domaine de production ajouté: `nythy-72973.firebaseapp.com`
  - [ ] Site Key et Secret Key récupérées
  - [ ] Type: reCAPTCHA Enterprise v3

### Firestore Rules

- [ ] **Rules de sécurité**
  - [ ] Rules testées localement
  - [ ] Indexes créés
  - [ ] Mode strict (pas de lecture/écriture publique)

### Code Quality

- [ ] **Tests et validation**
  - [ ] `npm run lint` : ✅ Aucune erreur
  - [ ] `npm run type-check` : ✅ Aucune erreur TypeScript
  - [ ] `npm run test` : ✅ Tests passés
  - [ ] `npm run test:security` : ✅ Sécurité validée

---

## 🏗️ Build et Déploiement

### Build

- [ ] **Build production réussi**
  ```powershell
  npm run build:firebase
  ```
  - [ ] Aucune erreur de build
  - [ ] Dossier `/out` généré
  - [ ] Taille du bundle vérifiée

### Déploiement Firebase

- [ ] **Firebase CLI installé**
  ```powershell
  firebase --version
  ```

- [ ] **Authentifié avec Firebase**
  ```powershell
  firebase login
  ```

- [ ] **Projet sélectionné**
  ```powershell
  firebase use nythy-72973
  ```

- [ ] **Déploiement Firestore**
  ```powershell
  npm run deploy:firestore
  ```
  - [ ] Rules déployées
  - [ ] Indexes créés

- [ ] **Déploiement Functions** (si applicable)
  ```powershell
  npm run deploy:functions
  ```
  - [ ] Build functions réussi
  - [ ] Toutes les functions déployées

- [ ] **Déploiement Hosting**
  ```powershell
  npm run deploy:firebase
  ```
  - [ ] Application déployée
  - [ ] URL accessible

---

## 🔒 Sécurité Production

### Headers de Sécurité

- [ ] **Headers HTTPS configurés**
  - [ ] `Strict-Transport-Security` (HSTS)
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-XSS-Protection`
  - [ ] `Referrer-Policy`
  - [ ] `Permissions-Policy`

### App Check

- [ ] **App Check activé**
  - [ ] Mode enforcement: STRICT
  - [ ] Tokens générés automatiquement
  - [ ] Debug token DÉSACTIVÉ en production

### Rate Limiting

- [ ] **Rate limiting configuré**
  - [ ] Upstash Redis configuré (recommandé)
  - [ ] Limites définies (120 req/min par défaut)

### Authentification

- [ ] **Identifiants admin modifiés**
  - [ ] Email admin changé (pas `admin@nythy.com`)
  - [ ] Mot de passe fort configuré
  - [ ] 2FA activé pour les comptes admin

---

## 🧪 Tests Post-Déploiement

### Tests Fonctionnels

- [ ] **Page d'accueil**
  - [ ] Chargement rapide (< 3s)
  - [ ] Images chargées
  - [ ] Navigation fonctionnelle

- [ ] **Authentification**
  - [ ] Inscription utilisateur
  - [ ] Connexion utilisateur
  - [ ] Déconnexion
  - [ ] 2FA fonctionnel

- [ ] **Dashboard Marchand**
  - [ ] Accès après connexion
  - [ ] Données chargées
  - [ ] CRUD produits fonctionnel
  - [ ] Upload images fonctionnel

- [ ] **Dashboard Admin**
  - [ ] Accès restreint aux admins
  - [ ] Toutes les sections accessibles
  - [ ] Gestion utilisateurs/marchands

### Tests de Sécurité

- [ ] **App Check**
  - [ ] Requêtes sans token bloquées
  - [ ] Requêtes avec token valide acceptées

- [ ] **Rate Limiting**
  - [ ] Réponse 429 après limite dépassée

- [ ] **CORS**
  - [ ] Origines non autorisées bloquées
  - [ ] Origines autorisées acceptées

### Tests de Performance

- [ ] **Lighthouse Score**
  - [ ] Performance: > 90
  - [ ] Accessibility: > 90
  - [ ] Best Practices: > 90
  - [ ] SEO: > 90

- [ ] **Temps de chargement**
  - [ ] First Contentful Paint: < 1.8s
  - [ ] Largest Contentful Paint: < 2.5s
  - [ ] Time to Interactive: < 3.8s

---

## 📊 Monitoring

### Firebase Console

- [ ] **Vérifier dans Firebase Console**
  - [ ] Hosting: URL active
  - [ ] Functions: Toutes déployées et actives
  - [ ] Firestore: Rules et indexes appliqués
  - [ ] Authentication: Providers activés
  - [ ] App Check: Métriques visibles

### Logs et Erreurs

- [ ] **Surveillance des logs**
  ```powershell
  firebase functions:log
  ```
  - [ ] Aucune erreur critique
  - [ ] Logs cohérents

- [ ] **Monitoring configuré** (optionnel mais recommandé)
  - [ ] Sentry configuré
  - [ ] Alertes email configurées
  - [ ] Dashboard de monitoring accessible

---

## 🔄 Post-Déploiement

### Documentation

- [ ] **Documentation à jour**
  - [ ] README.md mis à jour
  - [ ] URLs de production documentées
  - [ ] Variables d'environnement documentées

### Communication

- [ ] **Équipe informée**
  - [ ] Notification de déploiement envoyée
  - [ ] URL de production partagée
  - [ ] Changelog communiqué

### Backup

- [ ] **Backup avant déploiement**
  - [ ] Firestore data exportée
  - [ ] Code versionné dans Git
  - [ ] Tag de version créé

---

## 🚨 Rollback Plan

En cas de problème critique:

1. **Rollback Hosting**
   ```powershell
   firebase hosting:clone nythy-72973:previous-version nythy-72973:live
   ```

2. **Rollback Functions**
   ```powershell
   firebase functions:rollback FUNCTION_NAME
   ```

3. **Rollback Firestore Rules**
   - Restaurer les rules depuis le backup
   - Redéployer: `firebase deploy --only firestore:rules`

---

## ✅ Validation Finale

- [ ] Toutes les étapes ci-dessus complétées
- [ ] Application accessible en production
- [ ] Aucune erreur critique dans les logs
- [ ] Tests manuels passés
- [ ] Équipe notifiée
- [ ] Monitoring actif

---

**Date de déploiement:** _______________

**Déployé par:** _______________

**Version:** _______________

**Notes:** 
_______________________________________________
_______________________________________________
_______________________________________________

