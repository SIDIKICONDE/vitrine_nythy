# 🔐 Guide 2FA pour la Production

## ✅ Ce qui a été implémenté

### 1. **APIs Routes** 🚀
- ✅ `/api/merchant/2fa/enable` - Génération du secret TOTP
- ✅ `/api/merchant/2fa/verify` - Vérification et activation du 2FA
- ✅ `/api/merchant/2fa/disable` - Désactivation sécurisée du 2FA
- ✅ `/api/merchant/2fa/status` - Récupération du statut 2FA
- ✅ `/api/merchant/2fa/login-verify` - Vérification 2FA lors de la connexion

### 2. **Sécurité avancée** 🛡️
- ✅ **Rate limiting** : Max 5 tentatives par 15 minutes
- ✅ **Codes hashés** : SHA-256 pour les codes de récupération
- ✅ **Logs de sécurité** : Tous les événements 2FA sont loggés
- ✅ **App Check** : Protection contre les abus
- ✅ **Protection rejeu** : Token usage unique en production

### 3. **Composants UI** 🎨
- ✅ `TwoFactorSetup.tsx` - Configuration initiale du 2FA
- ✅ `TwoFactorLoginModal.tsx` - Vérification lors de la connexion
- ✅ Page Settings avec gestion complète du 2FA

### 4. **Fonctionnalités** ⚡
- ✅ Génération de QR code scannable
- ✅ 5 codes de récupération à usage unique
- ✅ Vérification TOTP avec fenêtre de ±60s
- ✅ Synchronisation automatique du statut
- ✅ Interface utilisateur intuitive

---

## 📋 Checklist de déploiement Production

### Avant le déploiement

1. **Configuration Firebase Console**
   ```
   ☐ Activer Multi-Factor Authentication dans Firebase Console
   ☐ Configurer les quotas (10 000 vérifications/jour gratuit)
   ☐ Vérifier les règles Firestore pour la collection 'security_logs'
   ```

2. **Variables d'environnement**
   ```bash
   # .env.production
   NODE_ENV=production
   NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
   # ... autres variables Firebase
   ```

3. **Test en staging**
   ```
   ☐ Tester l'activation du 2FA
   ☐ Tester la connexion avec 2FA
   ☐ Tester les codes de récupération
   ☐ Tester la désactivation du 2FA
   ☐ Vérifier les logs de sécurité
   ```

### Après le déploiement

1. **Monitoring**
   - Surveiller les logs `security_logs` dans Firestore
   - Vérifier les tentatives de brute force
   - Monitorer les quotas Firebase

2. **Support utilisateurs**
   - Préparer une FAQ sur le 2FA
   - Avoir une procédure de récupération de compte
   - Former le support client

---

## 🔄 Intégration dans le flux de connexion

### Option 1 : NextAuth Custom (Recommandé)

Modifier `lib/auth.ts` pour vérifier le 2FA après l'authentification :

```typescript
// Dans lib/auth.ts
async authorize(credentials) {
  // 1. Vérifier email/password comme actuellement
  const userRecord = await adminAuth.getUserByEmail(email);
  
  // 2. Vérifier si 2FA est activé
  const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
  const has2FA = userDoc.data()?.['2fa_enabled'];
  
  if (has2FA) {
    // Retourner un état intermédiaire pour demander le code 2FA
    return {
      id: userRecord.uid,
      email: userRecord.email,
      requires2FA: true,
      name: userRecord.displayName,
    };
  }
  
  // Sinon, connexion normale
  return { ... };
}
```

### Option 2 : Page de connexion personnalisée

1. Créer `app/merchant/login/page.tsx`
2. Gérer le flux :
   - Formulaire email/password
   - Si 2FA activé → afficher `TwoFactorLoginModal`
   - Vérifier via `/api/merchant/2fa/login-verify`
   - Rediriger vers le dashboard

---

## 📊 Logs de sécurité

Les événements suivants sont loggés dans `security_logs` :

| Type | Description |
|------|-------------|
| `2fa_setup_started` | Début de configuration 2FA |
| `2fa_enabled` | 2FA activé avec succès |
| `2fa_disabled` | 2FA désactivé |
| `2fa_login_success` | Connexion 2FA réussie |
| `2fa_login_failed` | Tentative 2FA échouée |

### Exemple de requête Firestore

```javascript
// Récupérer les tentatives échouées récentes
const failedAttempts = await adminDb
  .collection('security_logs')
  .where('type', '==', '2fa_login_failed')
  .where('timestamp', '>', yesterday)
  .get();
```

---

## 🚨 Rate Limiting

**Configuration actuelle** :
- 5 tentatives max par 15 minutes
- Par adresse email
- Stockage en mémoire (développement)

**Production** : Migrer vers Redis

```typescript
// Avec Redis
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

const key = `2fa-attempts:${email}`;
const attempts = await redis.incr(key);
await redis.expire(key, 900); // 15 minutes

if (attempts > 5) {
  return { error: 'Trop de tentatives' };
}
```

---

## 🔑 Codes de récupération

### Génération
- 5 codes par défaut
- Format : `XXXX-XXXX` (8 caractères)
- Hashés avec SHA-256 avant stockage

### Vérification lors de la connexion
```typescript
// Dans login-verify/route.ts
if (useRecoveryCode) {
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  const codeIndex = recoveryCodes.findIndex(rc => rc.hash === hash && !rc.used);
  // ...
}
```

### Régénération
TODO : Créer API `/api/merchant/2fa/regenerate-codes`

---

## 📱 Applications d'authentification supportées

- ✅ Google Authenticator (iOS, Android)
- ✅ Microsoft Authenticator (iOS, Android)
- ✅ Authy (iOS, Android, Desktop)
- ✅ 1Password (avec support TOTP)
- ✅ Toute app compatible TOTP (RFC 6238)

---

## 🆘 Procédure de récupération

Si un utilisateur perd l'accès à son app d'authentification :

1. **Avec codes de récupération** : Utiliser un des 5 codes
2. **Sans codes** : Contact support → vérification identité → désactivation manuelle

```typescript
// Désactivation manuelle par support (à sécuriser)
await adminDb.collection('users').doc(userId).update({
  '2fa_enabled': false,
  '2fa_secret': null,
  '2fa_recovery_codes': null,
  '2fa_support_disabled_at': new Date().toISOString(),
  '2fa_support_disabled_by': supportUserId,
});
```

---

## 🎯 Métriques à surveiller

1. **Taux d'adoption** : % d'utilisateurs avec 2FA activé
2. **Tentatives échouées** : Détection d'attaques potentielles
3. **Utilisation codes de récup** : Surveiller les pertes d'accès
4. **Temps de configuration** : UX du processus d'activation

---

## 📝 TODO Production

- [ ] Migrer rate limiting vers Redis
- [ ] Ajouter API régénération codes de récupération
- [ ] Créer dashboard de sécurité admin
- [ ] Notifications email lors d'événements 2FA
- [ ] Support SMS comme alternative (optionnel)
- [ ] Tests end-to-end automatisés
- [ ] Documentation utilisateur complète

---

## 🔗 Ressources

- [TOTP Specification (RFC 6238)](https://tools.ietf.org/html/rfc6238)
- [Firebase MFA Documentation](https://firebase.google.com/docs/auth/web/multi-factor)
- [OWASP 2FA Guide](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2024  
**Status** : ✅ Prêt pour Production (avec checklist complétée)

