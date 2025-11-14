# 🔧 Dépannage : Erreur "Failed to parse private key"

## ❌ Erreur

```
❌ Erreur lors de l'initialisation avec cert: Failed to parse private key: Error: Invalid PEM formatted message.
```

## 🔍 Diagnostic

### Sur le serveur VPS (Linux)

1. **Exécutez le script de diagnostic** :
```bash
cd /var/www/vitrine_nythy
bash scripts/diagnose-firebase-key.sh
```

2. **Ou utilisez Node.js** :
```bash
cd /var/www/vitrine_nythy
npx ts-node scripts/diagnose-firebase-key.ts
```

### Sur Windows (développement local)

```powershell
cd "C:\Users\Conde\Desktop\Nythy\vitrine nythy"
npx ts-node scripts/diagnose-firebase-key.ts
```

## ✅ Solutions

### Solution 1 : Utiliser le script de formatage automatique

Si vous avez le fichier JSON du service account Firebase :

```bash
# Sur le serveur VPS
cd /var/www/vitrine_nythy
bash scripts/format-firebase-key.sh firebase-service-account.json
```

Le script générera automatiquement les variables correctement formatées pour `.env.production`.

### Solution 2 : Formater manuellement la clé

1. **Obtenez votre clé privée depuis Firebase Console** :
   - Allez sur [Firebase Console](https://console.firebase.google.com/)
   - Sélectionnez votre projet
   - Paramètres du projet → Comptes de service
   - Cliquez sur "Générer une nouvelle clé privée"
   - Téléchargez le fichier JSON

2. **Extrayez la clé privée** :
   - Ouvrez le fichier JSON téléchargé
   - Copiez la valeur du champ `private_key`
   - C'est une chaîne avec de vrais retours à la ligne

3. **Formatez pour .env.production** :
   - Remplacez tous les retours à la ligne par `\n`
   - Mettez la clé entre guillemets doubles
   - Exemple :

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
```

### Solution 3 : Utiliser le fichier JSON directement (recommandé)

Au lieu d'utiliser les variables d'environnement, vous pouvez utiliser le fichier JSON directement :

1. **Copiez le fichier service account sur le serveur** :
```bash
# Depuis votre machine locale
scp firebase-service-account.json root@votre-serveur:/var/www/vitrine_nythy/
```

2. **Vérifiez que le fichier existe** :
```bash
cd /var/www/vitrine_nythy
ls -la firebase-service-account.json
```

3. **Le code utilisera automatiquement le fichier** au lieu des variables d'environnement.

## 🔄 Après correction

1. **Redémarrez l'application PM2** :
```bash
pm2 restart vitrine_nythy --update-env
```

2. **Vérifiez les logs** :
```bash
pm2 logs vitrine_nythy --lines 50
```

3. **Vérifiez que Firebase s'initialise correctement** :
   - Les logs doivent afficher : `✅ Firebase Admin initialisé avec credentials depuis variables d'environnement`
   - Ou : `✅ Firebase Admin initialisé avec fichier service account`

## 📋 Format correct de la clé

La clé privée dans `.env.production` doit :

1. ✅ Être entre guillemets doubles `"`
2. ✅ Contenir `-----BEGIN PRIVATE KEY-----` au début
3. ✅ Contenir `-----END PRIVATE KEY-----` à la fin
4. ✅ Utiliser `\n` (séquence d'échappement) pour les retours à la ligne, PAS de vrais retours à la ligne
5. ✅ Avoir `\n` après `BEGIN PRIVATE KEY-----`
6. ✅ Avoir `\n` avant `-----END PRIVATE KEY`

### Exemple correct :

```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKjMzEfYyjiWA4R4/M2bHZgHu\n...\n-----END PRIVATE KEY-----\n"
```

### Exemples incorrects :

❌ **Sans guillemets** :
```env
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
```

❌ **Avec de vrais retours à la ligne** :
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...
-----END PRIVATE KEY-----"
```

❌ **Sans \n** :
```env
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY----- MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC... -----END PRIVATE KEY-----"
```

## 🆘 Si le problème persiste

1. **Vérifiez que la clé n'est pas corrompue** :
   - Ré-générez une nouvelle clé depuis Firebase Console
   - Utilisez le script de formatage automatique

2. **Vérifiez les permissions du fichier .env.production** :
```bash
ls -la .env.production
chmod 600 .env.production  # Lecture/écriture pour le propriétaire uniquement
```

3. **Vérifiez que PM2 charge bien les variables** :
```bash
pm2 env 0 | grep FIREBASE_PRIVATE_KEY
```

4. **Utilisez le fichier JSON directement** (Solution 3 ci-dessus) - c'est plus fiable.

## 📚 Ressources

- [Documentation Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Guide de déploiement VPS](./PRODUCTION_VPS_SETUP.md)
- [Script de formatage](./scripts/format-firebase-key.sh)

