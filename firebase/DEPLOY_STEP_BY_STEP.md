# 🚀 Déploiement Step-by-Step - Backend Gamification

## ⚡ Déploiement Rapide (Script automatique)

```bash
cd firebase
chmod +x DEPLOY_GAMIFICATION_BACKEND.sh
./DEPLOY_GAMIFICATION_BACKEND.sh
```

---

## 📋 Déploiement Manuel (Étape par étape)

### Étape 1: Build 📦

```bash
cd firebase/functions
npm install
npm run build
```

**Vérification**: Le build doit se terminer sans erreur.

---

### Étape 2: Déployer Firestore 🔒

```bash
cd ..  # Retour dans firebase/
firebase deploy --only firestore:rules,firestore:indexes
```

**Vérification**: 
- Console Firebase > Firestore Database > Rules (vérifier les nouvelles rules)
- Console Firebase > Firestore Database > Indexes (vérifier les indexes)

---

### Étape 3: Déployer Cloud Functions ☁️

#### Option A: Toutes en une fois (recommandé)
```bash
firebase deploy --only functions:createTournament,functions:advanceTournamentPhase,functions:checkRegistrationDeadlines,functions:distributePrizes,functions:trackTournamentRegistration,functions:trackTournamentPopularity,functions:trackLeagueEngagement
```

#### Option B: Par groupe (si Option A échoue)

**Tournaments:**
```bash
firebase deploy --only functions:createTournament,functions:advanceTournamentPhase,functions:checkRegistrationDeadlines,functions:distributePrizes
```

**Analytics:**
```bash
firebase deploy --only functions:trackTournamentRegistration,functions:trackTournamentPopularity,functions:trackLeagueEngagement
```

---

### Étape 4: Vérifier le déploiement ✅

```bash
# Voir les logs
firebase functions:log --lines 100

# Lister les fonctions déployées
firebase functions:list
```

**Vérification Console Firebase**:
1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Functions > Dashboard
3. Vérifier que ces 7 fonctions apparaissent:
   - ✅ createTournament
   - ✅ advanceTournamentPhase
   - ✅ checkRegistrationDeadlines ⭐
   - ✅ distributePrizes
   - ✅ trackTournamentRegistration
   - ✅ trackTournamentPopularity
   - ✅ trackLeagueEngagement

---

## 🧪 Tests Post-Déploiement

### Test 1: createTournament (via Flutter app)

```dart
// Dans votre app Flutter
final callable = FirebaseFunctions.instance.httpsCallable('createTournament');

try {
  final result = await callable.call({
    'name': 'Test Tournament Production',
    'description': 'Premier tournoi en production',
    'startDate': DateTime.now().add(Duration(days: 7)).toIso8601String(),
    'endDate': DateTime.now().add(Duration(days: 14)).toIso8601String(),
    'maxParticipants': 100,
    'prizes': [
      {
        'id': 'first_place',
        'name': '🥇 Champion',
        'position': 1,
        'points': 1000,
        'gems': 50,
        'type': 'tournament',
      },
      {
        'id': 'second_place',
        'name': '🥈 Vice-Champion',
        'position': 2,
        'points': 500,
        'gems': 25,
        'type': 'tournament',
      },
      {
        'id': 'third_place',
        'name': '🥉 Troisième place',
        'position': 3,
        'points': 250,
        'gems': 10,
        'type': 'tournament',
      },
    ],
    'isPublic': true,
  });
  
  print('✅ Tournament created: ${result.data}');
} catch (e) {
  print('❌ Error: $e');
}
```

**Note**: L'utilisateur doit avoir `role: "admin"` dans Firestore (`users/{uid}`).

---

### Test 2: Vérifier Scheduled Functions

Les fonctions scheduled ne s'exécuteront qu'à leur horaire programmé:

| Fonction | Schedule | Première exécution |
|----------|----------|-------------------|
| `advanceTournamentPhase` | Every 6 hours | Dans max 6h |
| `checkRegistrationDeadlines` | Every 1 hour | Dans max 1h |
| `trackTournamentPopularity` | Daily 02:00 | Demain 02:00 |
| `trackLeagueEngagement` | Daily 03:00 | Demain 03:00 |

**Forcer l'exécution (dev only)**:
```bash
firebase functions:shell
> advanceTournamentPhase()
> checkRegistrationDeadlines()
> trackTournamentPopularity()
> trackLeagueEngagement()
```

---

### Test 3: Inscription à un tournoi

```dart
// S'inscrire au tournoi créé
final repository = TournamentRepositoryImpl(
  TournamentFirestoreDatasource(FirebaseFirestore.instance)
);

final result = await repository.registerPlayer(
  tournamentId: 'tournament_id_from_test_1',
  playerId: FirebaseAuth.instance.currentUser!.uid,
);

result.fold(
  (failure) => print('❌ Error: ${failure.message}'),
  (tournament) => print('✅ Registered! Participants: ${tournament.currentParticipants}'),
);
```

**Vérification**:
- `trackTournamentRegistration` doit se déclencher automatiquement
- Vérifier analytics: `analytics/tournaments/byTournament/{tournamentId}`

---

### Test 4: Vérifier les logs

```bash
# Logs temps réel
firebase functions:log

# Filtrer par fonction
firebase functions:log --only createTournament
firebase functions:log --only trackTournamentRegistration
```

---

## ⚠️ Troubleshooting

### Erreur: "UNAUTHENTICATED" sur createTournament

**Solution**: Ajouter dans Firestore:
```javascript
// Collection: users
// Document: {votre_user_id}
{
  role: "admin",
  isAdmin: true,
  email: "votre@email.com"
}
```

### Erreur: "Build failed"

```bash
cd firebase/functions
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erreur: Scheduled function ne démarre pas

**Attendre 1-2h** pour la première exécution. Les Cloud Scheduler jobs prennent du temps à s'initialiser.

**Vérifier dans Cloud Console**:
- Cloud Scheduler > Voir les jobs
- Ils doivent apparaître avec status "Enabled"

### Logs vides ou erreur région

```bash
firebase functions:log --region europe-west1 --lines 100
```

---

## 📊 Monitoring Continu

### Dashboards Firebase

1. **Functions Dashboard**
   - Invocations par fonction
   - Temps d'exécution moyen
   - Taux d'erreur

2. **Alerting**
   - Configurer alerte si erreur rate > 5%
   - Configurer alerte si temps exécution > 30s

3. **Logs Explorer**
   - Filtrer par severity: ERROR
   - Filtrer par function name

---

## 💰 Vérifier les coûts

Après 24h de production:

```bash
# Voir les métriques
firebase functions:list

# Console Google Cloud > Billing
# Vérifier les coûts Firebase Functions
```

**Estimé**: ~$2/mois avec 1000 joueurs actifs ✅

---

## 🔄 Rollback si problème

```bash
# Lister les versions
firebase functions:list

# Rollback une fonction spécifique
firebase functions:rollback createTournament --version <previous_version>

# Ou désactiver temporairement
firebase functions:delete createTournament
```

---

## ✅ Checklist Finale

Avant de considérer le déploiement comme réussi:

- [ ] Build sans erreur
- [ ] Firestore rules déployées
- [ ] Firestore indexes créés
- [ ] 7 Cloud Functions déployées
- [ ] Test createTournament réussi
- [ ] Test inscription tournoi réussi
- [ ] trackTournamentRegistration se déclenche
- [ ] Logs accessibles
- [ ] Monitoring configuré
- [ ] Alertes activées (optionnel)
- [ ] Documentation lue

---

## 🎉 Succès !

Si tout est ✅, le backend gamification est **EN PRODUCTION** ! 🚀

**Prochaines étapes**:
1. Surveiller les logs pendant 48h
2. Créer quelques tournois de test
3. Inviter des beta testers
4. Collecter feedback
5. Itérer si nécessaire

---

**Questions?** Consulter `docs/GAMIFICATION_CLOUD_FUNCTIONS.md` pour la doc complète.

**Support**: Vérifier les logs avec `firebase functions:log`

