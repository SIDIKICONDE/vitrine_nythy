# 📋 Catégories disponibles pour les marchands

## ✅ Toutes les catégories sont disponibles

Les marchands peuvent choisir parmi **25 catégories** lors de la création de produits.

## 🏷️ Liste complète des catégories

### 📦 Alimentation de base (6 catégories)

| ID | Nom affiché | Emoji | Utilisation |
|----|-------------|-------|-------------|
| `bakery` | Boulangerie & Pâtisserie | 🥖 | Pain, croissants, gâteaux |
| `cerealsAndStarches` | Céréales & Féculents | 🍞 | Riz, pâtes, céréales |
| `meatAndPoultry` | Viandes & Volailles | 🥩 | Viandes, poulet, charcuterie |
| `fishAndSeafood` | Poissons & Fruits de mer | 🐟 | Poisson, crevettes, fruits de mer |
| `dairyProducts` | Produits Laitiers | 🥛 | Lait, yaourt, fromage |
| `eggs` | Œufs | 🥚 | Œufs frais, œufs bio |

### 🍎 Fruits et légumes (2 catégories)

| ID | Nom affiché | Emoji | Utilisation |
|----|-------------|-------|-------------|
| `vegetables` | Légumes | 🥕 | Légumes frais, salades |
| `fruits` | Fruits | 🍎 | Fruits frais de saison |

### 🥬 Produits frais et spécialités (4 catégories)

| ID | Nom affiché | Emoji | Utilisation |
|----|-------------|-------|-------------|
| `freshProducts` | Produits Frais | 🥬 | Produits frais variés |
| `organicVegan` | Bio & Végan | 🌱 | Produits bio et végans |
| `restaurantMeals` | Restauration & Plats | 🍽️ | **Repas complets**, plats préparés |
| `cateringEvents` | Événementiel & Traiteur | 🎉 | **Repas complets**, traiteur, buffets |

### 🥜 Autres catégories alimentaires (8 catégories)

| ID | Nom affiché | Emoji | Utilisation |
|----|-------------|-------|-------------|
| `nutsAndSeeds` | Noix & Graines | 🥜 | Noix, graines, oléagineux |
| `legumes` | Légumineuses | 🫘 | Lentilles, pois chiches, haricots |
| `oilsAndFats` | Huiles & Matières grasses | 🫒 | Huiles, beurre, margarine |
| `sweeteners` | Édulcorants | 🍯 | Miel, sucre, sirops |
| `condimentsAndSpices` | Condiments & Épices | 🧂 | Sel, épices, sauces |
| `beverages` | Boissons | ☕ | Jus, sodas, café, thé |
| `dessertsAndConfectionery` | Desserts & Confiseries | 🍰 | Desserts, bonbons, chocolat |
| `snacksAndAppetizers` | Snacks & En-cas | 🍿 | Chips, biscuits, snacks |

### 🧊 Catégories spéciales (4 catégories)

| ID | Nom affiché | Emoji | Utilisation |
|----|-------------|-------|-------------|
| `processedFoods` | Aliments Transformés | 🥫 | Conserves, plats préparés |
| `herbs` | Herbes Aromatiques | 🌿 | Basilic, persil, herbes fraîches |
| `mushrooms` | Champignons | 🍄 | Champignons frais, séchés |
| `frozenFoods` | Surgelés | 🧊 | Produits surgelés |

### 🏷️ Divers (1 catégorie)

| ID | Nom affiché | Emoji | Utilisation |
|----|-------------|-------|-------------|
| `other` | Autres / Divers | 🏷️ | Autres produits non classés |

---

## 🔍 Catégories avec sections dédiées dans l'app

Certaines catégories ont des sections spéciales sur l'écran d'accueil :

- ✅ **Boulangerie** (`bakery`) → Section "Boulangerie & pâtisserie"
- ✅ **Repas complets** (`restaurantMeals` + `cateringEvents`) → Section "Repas complets"

Les autres catégories apparaissent dans :
- Section "Recommandé pour vous"
- Section "Offres urgentes"
- Section "Près de chez vous"
- Page de recherche et filtres

---

## 📱 Interface marchand

### Création de produit

1. **Le marchand accède au formulaire** : `/merchant/products/new`
2. **Champ "Catégorie principale"** : Dropdown avec recherche
3. **Toutes les 25 catégories sont disponibles** triées alphabétiquement
4. **Recherche intelligente** : Par nom ou emoji

### Validation

- La catégorie principale est **obligatoire**
- La sous-catégorie est **optionnelle**

---

## 🎯 Harmonisation

### ✅ Ce qui a été fait

1. **Suppression** de l'ancien `FoodCategoryService.ts` (8 catégories obsolètes)
2. **Source unique** : `types/product-categories.ts` (25 catégories)
3. **Fonction centralisée** : `getAllCategories()` retourne les 25 catégories
4. **Tri alphabétique** : Catégories triées par nom d'affichage

### 🔄 Synchronisation

Les catégories sont synchronisées entre :
- ✅ Interface web marchands (TypeScript)
- ✅ Application mobile (Flutter/Dart)
- ✅ Backend Firebase (TypeScript)
- ✅ Base de données Firestore

---

## 📊 Statistiques

- **Total** : 25 catégories
- **Principales** : 11 catégories (affichage prioritaire)
- **Avec sections dédiées** : 2 catégories (bakery, restaurantMeals/cateringEvents)
- **Disponibles côté marchand** : **25 catégories** ✅

---

## 🚀 Prochaines étapes recommandées

1. ✅ Vérifier que tous les imports utilisent `types/product-categories.ts`
2. ✅ Tester la création de produits avec chaque catégorie
3. ✅ Vérifier l'affichage dans l'app mobile
4. 📝 Former les marchands sur les catégories appropriées
5. 📊 Analyser l'utilisation des catégories pour optimiser l'affichage

---

**Date de mise à jour** : 12 novembre 2025
**Version** : 1.0
**Statut** : ✅ Harmonisé

