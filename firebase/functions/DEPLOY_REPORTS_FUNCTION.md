# Déploiement de la fonction de signalement

## 🚀 Nouvelle fonction TypeScript

La fonction `onReportCreated` a été migrée de JavaScript (v1) vers TypeScript (v2) avec des améliorations majeures.

## ✨ Améliorations

### Par rapport à l'ancienne version (reports.js)

1. **API Firebase v2** : Utilise la nouvelle API plus moderne et performante
2. **Notifications Push FCM** : Envoie des notifications push réelles aux admins
3. **TypeScript** : Meilleure sûreté de types et maintenabilité
4. **Gestion d'erreurs améliorée** : Meilleure traçabilité des erreurs
5. **Format des notifications** : Structure cohérente avec le reste de l'app

### Fonctionnalités

✅ Notifie tous les administrateurs en temps réel  
✅ Crée des documents de notification dans Firestore  
✅ Envoie des notifications push FCM  
✅ Met à jour les statistiques de signalement  
✅ **Confidentialité** : Ni le propriétaire du post, ni l'utilisateur qui signale ne sont notifiés  

## 📦 Déploiement

### 1. Build du projet TypeScript

```bash
cd firebase/functions
npm run build
```

### 2. Déployer uniquement la fonction de signalement

```bash
firebase deploy --only functions:onReportCreated
```

### 3. Déployer toutes les fonctions

```bash
firebase deploy --only functions
```

## 🔧 Configuration requise

### Collection Firestore

- `reports` : Collection des signalements
- `notifications` : Collection des notifications
- `users` : Collection des utilisateurs (avec champ `role` et `deviceToken`)
- `admins` : Collection optionnelle des administrateurs
- `admin_stats` : Collection des statistiques

### Champs requis dans users

```json
{
  "role": "admin" | "moderator" | "user",
  "deviceToken": "string" // Token FCM pour notifications push
}
```

## 📊 Monitoring

### Logs Cloud Functions

```bash
firebase functions:log --only onReportCreated
```

### Vérifier les déploiements

```bash
firebase functions:list
```

## 🧪 Test

Pour tester la fonction, créez un signalement depuis l'app :

1. Signaler un post
2. Vérifier les logs : `firebase functions:log`
3. Vérifier que les admins reçoivent la notification
4. Vérifier dans Firestore : collection `notifications`

## ⚠️ Notes importantes

### Confidentialité

- Le propriétaire du post signalé **ne reçoit AUCUNE notification**
- L'utilisateur qui signale **ne reçoit AUCUNE notification**
- Seuls les **administrateurs/modérateurs** sont notifiés

### Sécurité

- Les règles Firestore valident le format du signalement
- Les admins sont récupérés de manière sécurisée
- Les tokens FCM invalides sont ignorés

## 🔄 Migration de l'ancienne version

L'ancienne fonction JavaScript (`reports.js`) reste disponible mais la nouvelle version TypeScript est recommandée.

### Différences

| Fonctionnalité | Ancienne (JS v1) | Nouvelle (TS v2) |
|----------------|------------------|------------------|
| API Firebase | v1 | v2 |
| Notifications Push | ❌ Non | ✅ Oui |
| TypeScript | ❌ Non | ✅ Oui |
| Gestion erreurs | Basique | Avancée |
| Performance | Standard | Optimisée |

## 📝 Structure de notification

```json
{
  "id": "auto-generated",
  "type": "report",
  "recipientId": "admin_user_id",
  "title": "🚩 Nouveau signalement",
  "message": "📝 post signalé pour spam",
  "data": {
    "reportId": "report_doc_id",
    "targetId": "post_id",
    "targetType": "post",
    "reason": "spam",
    "reporterId": "user_id"
  },
  "createdAt": "Timestamp",
  "isRead": false,
  "readAt": null,
  "senderId": null
}
```

## 🎯 Prochaines étapes

1. ✅ Déployer la fonction
2. ✅ Tester avec un signalement réel
3. ⏳ Surveiller les logs pendant 24h
4. ⏳ Optionnel : Désactiver l'ancienne fonction JS si tout fonctionne

