# Scripts de Migration Firebase

Ce dossier contient des scripts de migration pour corriger et mettre à jour les données Firebase.

## 🔧 Fix User Display Names

**Script:** `fix_user_display_names.js`

### Problème résolu

Ce script corrige les noms d'affichage des utilisateurs qui ont été générés automatiquement à partir de leur email. Les noms contenant des points, underscores ou tirets sont reformatés en noms propres avec capitalisation.

**Exemples de transformations :**
- `conde.sidiki` → `Conde Sidiki`
- `jean_paul` → `Jean Paul`
- `marie-claire` → `Marie Claire`
- `john.doe.smith` → `John Doe Smith`

### Collections affectées

- `users` - Collection principale des utilisateurs
- `profiles` - Collection des profils utilisateurs

### Comment exécuter

#### Option 1 : Depuis le répertoire functions

```bash
cd firebase/functions
node migrations/fix_user_display_names.js
```

#### Option 2 : Via Firebase Functions (déploiement)

Si vous souhaitez déployer ce script comme une fonction callable :

1. Ajoutez dans `firebase/functions/index.js` :

```javascript
const { migrateDisplayNames } = require('./migrations/fix_user_display_names');

exports.migrateUserDisplayNames = onCall(async (request) => {
  // Vérifier que l'utilisateur est admin
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Non authentifié');
  }
  
  const isAdmin = await checkIsAdmin(request.auth.uid);
  if (!isAdmin) {
    throw new HttpsError('permission-denied', 'Accès réservé aux admins');
  }
  
  return await migrateDisplayNames();
});
```

2. Déployez :

```bash
firebase deploy --only functions:migrateUserDisplayNames
```

3. Appelez depuis l'app ou la console Firebase.

### Sécurité

⚠️ **Important** : Ce script modifie les données utilisateur. Recommandations :

1. **Testez d'abord sur un environnement de développement**
2. **Faites une sauvegarde Firestore avant d'exécuter**
3. **Vérifiez les logs pendant l'exécution**
4. **Exécutez uniquement par un administrateur**

### Rapport d'exécution

Le script affiche un rapport détaillé :

```
═══════════════════════════════════════
📊 RAPPORT DE MIGRATION
═══════════════════════════════════════
✅ Mis à jour: 45
⏭️  Ignorés: 123
❌ Erreurs: 0
═══════════════════════════════════════
```

### Notes

- Les utilisateurs qui ont déjà un nom formaté correctement ne seront pas modifiés
- Le champ `updatedAt` est mis à jour pour les documents modifiés
- Les erreurs sont loggées mais n'arrêtent pas le processus
- La migration est idempotente (peut être exécutée plusieurs fois sans problème)

