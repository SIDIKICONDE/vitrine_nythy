# 🌱 Impact Environnemental - Documentation complète

## Vue d'ensemble

Le système d'**impact environnemental** permet aux marchands de renseigner les économies écologiques liées à leurs produits anti-gaspillage, et aux consommateurs de visualiser ces informations sur la page de détail de l'offre.

---

## 📝 1. Création par le marchand

### Page de création d'offre (`/merchant/products/new`)

Le marchand peut renseigner **2 informations environnementales** lors de la création d'un produit :

```typescript
const productData = {
  // ... autres champs ...
  weightGrams: data.weightGrams || null,        // Poids en grammes
  co2SavedGrams: data.co2SavedGrams || null,   // CO2 économisé en grammes
};
```

### Champs disponibles

| Champ | Type | Description | Exemple | Obligatoire |
|-------|------|-------------|---------|-------------|
| `weightGrams` | `number` (optionnel) | Poids approximatif du produit en grammes | `500` (pour 500g) | ❌ Non |
| `co2SavedGrams` | `number` (optionnel) | CO2 économisé en grammes grâce à l'anti-gaspillage | `300` (pour 300g de CO2) | ❌ Non |

### Interface utilisateur

Le marchand remplit ces champs dans le formulaire de création de produit :

```
┌─────────────────────────────────────────────┐
│ 🌱 Impact environnemental (optionnel)       │
├─────────────────────────────────────────────┤
│                                             │
│ Poids approximatif (grammes)                │
│ ┌─────────────────────────────────┐        │
│ │ 500                              │        │
│ └─────────────────────────────────┘        │
│                                             │
│ CO₂ économisé (grammes)                     │
│ ┌─────────────────────────────────┐        │
│ │ 300                              │        │
│ └─────────────────────────────────┘        │
│                                             │
│ ℹ️ Ces informations permettent aux          │
│    consommateurs de voir l'impact positif  │
│    de leur achat sur l'environnement       │
└─────────────────────────────────────────────┘
```

---

## 💾 2. Stockage dans la base de données

### Structure Firestore

Les données sont stockées dans la collection `merchants/{merchantId}/products/{productId}` :

```json
{
  "title": "Pain de campagne invendu",
  "description": "Pain bio du jour",
  "weight_grams": 500,              // ✅ Poids en grammes
  "co2_saved_grams": 300,           // ✅ CO2 économisé en grammes
  // ... autres champs ...
}
```

### Conversion dans le modèle Flutter

Côté Flutter (`MerchantProduct`), ces données sont mappées :

```dart
@freezed
abstract class MerchantProduct with _$MerchantProduct {
  const factory MerchantProduct({
    // ... autres champs ...
    final double? weightGrams,        // Poids approximatif
    final int? co2SavedGrams,        // CO2 économisé en grammes
  }) = _MerchantProduct;
}
```

---

## 📱 3. Affichage côté consommateur (App mobile Flutter)

### Page de détail de l'offre

Les informations environnementales sont affichées dans **2 sections** :

#### Section 1️⃣ : Conseils Anti-Gaspillage

```dart
// lib/features/offers/screens/offer_detail/offer_detail_screen.dart

OfferAntiGaspiWidget(
  conseils: offer?.product.co2SavedGrams != null
    ? [
        OffersStrings.defaultTip1,
        OffersStringsExtensions.formatCo2Saved(
          offer!.product.co2SavedGrams! / 1000,  // Conversion g → kg
        ),
      ]
    : [OffersStrings.defaultTip1],
)
```

**Rendu visuel :**

```
┌─────────────────────────────────────────┐
│ 🌱 Conseils Anti-Gaspillage            │
├─────────────────────────────────────────┤
│                                         │
│ 💡 Consommez rapidement après achat    │
│                                         │
│ 🌱 En achetant ce produit, vous        │
│    économisez 0.3 kg de CO2 !          │
│                                         │
└─────────────────────────────────────────┘
```

#### Section 2️⃣ : Statistiques d'impact (si disponibles)

```dart
// lib/features/offers/screens/offer_detail/widgets/offer_anti_gaspi_widget.dart

Row(
  children: [
    Expanded(
      child: _buildStatItem(
        context, theme,
        OffersStrings.foodSaved,
        '${foodSaved.toStringAsFixed(1)} kg',  // Calculé depuis weightGrams
        Icons.restaurant,
      ),
    ),
    Expanded(
      child: _buildStatItem(
        context, theme,
        OffersStrings.co2Saved,
        '${co2Saved.toStringAsFixed(1)} kg',  // Depuis co2SavedGrams
        Icons.eco,
      ),
    ),
    Expanded(
      child: _buildStatItem(
        context, theme,
        OffersStrings.waterSaved,
        '${waterSaved.toStringAsFixed(0)} L',  // Calculé
        Icons.water_drop,
      ),
    ),
  ],
)
```

**Rendu visuel :**

```
┌────────────────────────────────────────────────┐
│        🌱 Impact environnemental              │
├────────────────────────────────────────────────┤
│                                                │
│  🍽️              ☁️             💧            │
│  0.5 kg         0.3 kg         250 L         │
│  Nourriture     CO2            Eau           │
│  sauvée         économisé      économisée    │
│                                                │
└────────────────────────────────────────────────┘
```

---

## 🔄 4. Flux de données complet

```
┌──────────────────────────────────────────────────────────────────┐
│                     FLUX COMPLET                                 │
└──────────────────────────────────────────────────────────────────┘

1️⃣ CRÉATION PAR LE MARCHAND
┌──────────────────────────────┐
│ Marchand remplit formulaire  │
│ - Poids: 500g               │
│ - CO2: 300g                 │
└──────────┬───────────────────┘
           │
           ▼
2️⃣ ENVOI À L'API
┌──────────────────────────────┐
│ POST /api/merchant/{id}/     │
│     products                 │
│ {                            │
│   weightGrams: 500,          │
│   co2SavedGrams: 300         │
│ }                            │
└──────────┬───────────────────┘
           │
           ▼
3️⃣ STOCKAGE FIREBASE
┌──────────────────────────────┐
│ Firestore:                   │
│ merchants/{id}/products/{id} │
│ {                            │
│   weight_grams: 500,         │
│   co2_saved_grams: 300       │
│ }                            │
└──────────┬───────────────────┘
           │
           ▼
4️⃣ RÉCUPÉRATION CÔTÉ APP
┌──────────────────────────────┐
│ OffersRepository             │
│ getNearbyOffers()            │
│ → MerchantProduct            │
│   weightGrams: 500           │
│   co2SavedGrams: 300         │
└──────────┬───────────────────┘
           │
           ▼
5️⃣ TRANSFORMATION EN OFFRE
┌──────────────────────────────┐
│ Offer {                      │
│   product: MerchantProduct { │
│     weightGrams: 500,        │
│     co2SavedGrams: 300       │
│   }                          │
│ }                            │
└──────────┬───────────────────┘
           │
           ▼
6️⃣ AFFICHAGE DANS L'APP
┌──────────────────────────────┐
│ OfferDetailScreen            │
│ ├─ OfferAntiGaspiWidget      │
│ │  → "0.3 kg CO2 économisés" │
│ └─ Statistiques              │
│    → Nourriture: 0.5 kg      │
│    → CO2: 0.3 kg             │
│    → Eau: 250 L              │
└──────────────────────────────┘
```

---

## 🎨 5. Composants UI Flutter

### Widget principal : `OfferAntiGaspiWidget`

**Fichier :** `lib/features/offers/screens/offer_detail/widgets/offer_anti_gaspi_widget.dart`

**Rôle :** Affiche les conseils anti-gaspillage et les statistiques environnementales

```dart
class OfferAntiGaspiWidget extends StatelessWidget {
  const OfferAntiGaspiWidget({
    required this.conseils,
    super.key,
  });
  
  final List<String> conseils;
  
  @override
  Widget build(BuildContext context) {
    // Calculs basés sur weightGrams et co2SavedGrams
    final foodSaved = weightGrams / 1000;        // kg
    final co2Saved = co2SavedGrams / 1000;       // kg
    final waterSaved = foodSaved * 500;          // L (approximatif)
    
    // Affichage des statistiques...
  }
}
```

### Widget secondaire : `OfferEcoImpact`

**Fichier :** `lib/shared/widgets/offer_card/component/offer_eco_impact.dart`

**Rôle :** Badge compact pour afficher le CO2 économisé sur les cartes d'offres

```dart
class OfferEcoImpact extends StatelessWidget {
  const OfferEcoImpact({required this.co2Saved, super.key});
  
  final int co2Saved;  // en grammes
  
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(Icons.eco, size: 13.0),
        Text('${(co2Saved / 1000).toStringAsFixed(1)} kg CO₂ économisés'),
      ],
    );
  }
}
```

---

## 📊 6. Calculs automatiques

L'application calcule automatiquement certaines valeurs à partir des données fournies :

### Formules utilisées

| Métrique | Formule | Exemple |
|----------|---------|---------|
| **Nourriture sauvée** | `weightGrams / 1000` kg | 500g → 0.5 kg |
| **CO2 économisé** | `co2SavedGrams / 1000` kg | 300g → 0.3 kg |
| **Eau économisée** | `foodSaved * 500` L (approximatif) | 0.5 kg → 250 L |

### Valeurs par défaut

Si le marchand ne renseigne pas les valeurs :
- ❌ La section "Impact environnemental" n'est **pas affichée**
- ✅ Seuls les conseils génériques sont montrés

---

## 💡 7. Bonnes pratiques pour les marchands

### Comment estimer le CO2 économisé ?

**Valeurs moyennes par type de produit :**

| Type de produit | CO2 évité (g/kg) | Exemple |
|----------------|------------------|---------|
| **Pain/Viennoiseries** | 600 g/kg | Pain 500g → 300g CO2 |
| **Légumes frais** | 200 g/kg | Légumes 1kg → 200g CO2 |
| **Fruits** | 150 g/kg | Fruits 800g → 120g CO2 |
| **Viande** | 6000 g/kg | Viande 500g → 3000g CO2 |
| **Poisson** | 3000 g/kg | Poisson 400g → 1200g CO2 |
| **Produits laitiers** | 1300 g/kg | Fromage 200g → 260g CO2 |
| **Plats cuisinés** | 1000 g/kg | Plat 600g → 600g CO2 |

### Conseils de saisie

1. **Poids** : Utiliser le poids réel du produit (en grammes)
2. **CO2** : Utiliser la formule `poids_kg * facteur_emission`
3. **Arrondissement** : Arrondir à la dizaine la plus proche pour simplifier

**Exemple concret :**
```
Produit : Pain de campagne bio
Poids : 800g
Type : Pain (600g CO2/kg)
Calcul : 0.8 kg × 600 = 480g CO2
Saisie : weightGrams = 800
        co2SavedGrams = 480
```

---

## 🔍 8. Récupération des données dans l'app

### Code Flutter pour accéder aux informations

```dart
// Dans la page de détail de l'offre
final offer = ref.watch(offerProvider(offerId)).value;

// Accès aux données environnementales
if (offer != null) {
  final weight = offer.product.weightGrams;         // double? en grammes
  final co2 = offer.product.co2SavedGrams;          // int? en grammes
  
  // Conversion en kilogrammes pour l'affichage
  if (co2 != null) {
    final co2Kg = co2 / 1000;
    print('CO2 économisé : ${co2Kg.toStringAsFixed(1)} kg');
  }
  
  if (weight != null) {
    final weightKg = weight / 1000;
    print('Poids du produit : ${weightKg.toStringAsFixed(2)} kg');
  }
}
```

### Accès depuis le widget

```dart
class MyCustomWidget extends StatelessWidget {
  const MyCustomWidget({required this.offer, super.key});
  
  final Offer offer;
  
  @override
  Widget build(BuildContext context) {
    // Vérifier si les données environnementales existent
    final hasEcoData = offer.product.co2SavedGrams != null || 
                       offer.product.weightGrams != null;
    
    if (hasEcoData) {
      return OfferEcoImpact(
        co2Saved: offer.product.co2SavedGrams ?? 0,
      );
    }
    
    return const SizedBox.shrink();
  }
}
```

---

## 📈 9. Cas d'utilisation

### Exemple 1 : Boulangerie

```typescript
// Création par le marchand
{
  title: "Baguettes tradition de la veille",
  category: "bakery",
  weightGrams: 250,      // 1 baguette = 250g
  co2SavedGrams: 150,    // 250g × 0.6 = 150g CO2
}

// Affichage consommateur
┌──────────────────────────────┐
│ 🌱 Impact environnemental    │
├──────────────────────────────┤
│ 🍽️ 0.25 kg sauvés           │
│ ☁️ 0.15 kg CO2 économisés   │
│ 💧 125 L d'eau économisés   │
└──────────────────────────────┘
```

### Exemple 2 : Restaurant

```typescript
// Création par le marchand
{
  title: "Lasagnes végétariennes",
  category: "restaurantMeals",
  weightGrams: 600,      // Portion 600g
  co2SavedGrams: 600,    // 600g × 1.0 = 600g CO2
}

// Affichage consommateur
┌──────────────────────────────┐
│ 🌱 Impact environnemental    │
├──────────────────────────────┤
│ 🍽️ 0.6 kg sauvés            │
│ ☁️ 0.6 kg CO2 économisés    │
│ 💧 300 L d'eau économisés   │
└──────────────────────────────┘
```

---

## ✅ 10. Checklist pour le marchand

Lors de la création d'un produit anti-gaspillage :

- [ ] **Renseigner le poids** (`weightGrams`) en grammes
- [ ] **Calculer le CO2 économisé** selon le type de produit
- [ ] **Saisir le CO2** (`co2SavedGrams`) en grammes
- [ ] **Vérifier l'aperçu** dans l'app mobile
- [ ] **Ajuster si nécessaire** pour refléter la réalité

---

## 🎯 Résumé

| Étape | Responsable | Action | Outil |
|-------|-------------|--------|-------|
| **1. Création** | Marchand | Saisir poids et CO2 | Formulaire web |
| **2. Stockage** | Système | Enregistrer dans Firestore | Backend |
| **3. Récupération** | App mobile | Charger les offres | `OffersRepository` |
| **4. Affichage** | App mobile | Montrer l'impact | `OfferDetailScreen` |
| **5. Calculs** | App mobile | Calculer eau, nourriture | Automatique |

---

**Date de mise à jour :** 12 novembre 2025  
**Version :** 1.0  
**Statut :** ✅ Opérationnel

