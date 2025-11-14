# 📚 Documentation du Domaine Merchants

## 📋 Vue d'ensemble

Le domaine **Merchants** implémente la logique métier pour la fonctionnalité **commerçants anti-gaspillage** de type **Too Good To Go**. Il suit l'architecture **Domain-Driven Design (DDD)** et constitue le cœur métier de l'application.

## 🏗️ Architecture du Domaine

```
lib/features/merchants/domain/
├── entities/                      # Entités du domaine
│   ├── merchant.dart             # 🏪 Commerçant (agrégat principal)
│   ├── merchant_product.dart     # 🍞 Produit anti-gaspillage
│   ├── product.dart              # 📦 Produit générique
│   ├── order.dart                # 🛒 Commande
│   ├── category.dart             # 🏷️ Catégorie
│   ├── dashboard_summary.dart    # 📊 Résumé dashboard
│   ├── merchant_event.dart       # 📅 Événement marchand
│   ├── merchant_registration.dart # 📝 Inscription
│   └── merchant_sales_stats.dart  # 📈 Statistiques ventes
├── repositories/                  # Interfaces repositories
│   ├── merchant_repository.dart
│   ├── product_repository.dart
│   ├── order_repository.dart
│   └── category_repository.dart
├── usecases/                     # 🎯 Cas d'usage (31 fichiers)
│   ├── get_merchant_by_id_usecase.dart
│   ├── search_nearby_merchants_usecase.dart
│   ├── create_product_usecase.dart
│   ├── update_order_status_usecase.dart
│   └── ... (27 autres use cases)
├── services/                     # Services de domaine
│   ├── distance_service.dart    # 📍 Calculs géographiques
│   ├── category_service.dart    # 🏷️ Gestion catégories
│   └── food_category_service.dart
├── events/                       # Événements du domaine
│   ├── merchant_verified_event.dart
│   └── order_completed_event.dart
├── exceptions.dart               # 🚨 Exceptions métier
├── enums.dart                   # 📝 Énumérations
├── value_objects.dart           # 💎 Value Objects
└── filters.dart                 # 🔍 Filtres de recherche
```

---

## 📦 Entités du Domaine

### 🏪 1. Merchant (Commerçant)

**Agrégat principal** représentant un commerçant anti-gaspillage.

```dart
@freezed
class Merchant with _$Merchant {
  const factory Merchant({
    required String id,
    required String name,
    required MerchantType type,
    String? description,
    List<String> imageUrls,
    String? bannerUrl,
    GeoLocation? location,
    String? addressLine1,
    String? addressLine2,
    String? city,
    String? countryCode,
    List<String> tags,
    PriceLevel? priceLevel,
    String? phone,
    String? websiteUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
    double? distanceKm,
    bool isVerified,
    bool isActive,
    // ... autres champs
  }) = _Merchant;
}
```

**Propriétés clés:**
- `id`: Identifiant unique
- `type`: Type de commerce (restaurant, boulangerie, etc.)
- `location`: Géolocalisation (GeoLocation)
- `isVerified`: Statut de vérification
- `isActive`: Commerce actif ou non

**Méthodes:**
- `get fullAddress`: Adresse complète formatée
- `get isOpen`: Vérifier si le commerce est ouvert
- `get hasValidLocation`: Localisation valide

### 🍞 2. MerchantProduct (Produit Anti-gaspillage)

Produit avec **prix original** et **prix réduit** pour lutter contre le gaspillage.

```dart
@freezed
class MerchantProduct with _$MerchantProduct {
  const factory MerchantProduct({
    required String id,
    required String merchantId,
    required String title,
    String? description,
    required Money originalPrice,
    required Money discountedPrice,
    required int quantity,
    required DateTime pickupStart,
    required DateTime pickupEnd,
    List<String> dietaryTags,
    List<String> allergenTags,
    bool isSurpriseBox,
    String? category,
    List<String> imageUrls,
    ProductStatus status,
  }) = _MerchantProduct;
}
```

**Propriétés calculées:**
- `discountPercentage`: Pourcentage de réduction
- `isAvailableNow`: Disponible maintenant
- `isPickupToday`: Retrait aujourd'hui
- `savingsAmount`: Économies réalisées

**Validation:**
- Prix réduit < prix original
- Dates de retrait cohérentes
- Quantité positive

### 📦 3. Product (Produit générique)

```dart
@freezed
class Product with _$Product {
  const factory Product({
    required String id,
    required String merchantId,
    required String name,
    String description,
    String category,
    required double price,
    double? originalPrice,
    String? imageUrl,
    List<String> images,
    bool isActive,
    int quantity,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _Product;
}
```

**Propriétés:**
- Support multi-images
- Prix avec réduction optionnelle
- Gestion du stock

### 🛒 4. Order (Commande)

```dart
@freezed
class Order with _$Order {
  const factory Order({
    required String id,
    required String userId,
    required String merchantId,
    required List<OrderItem> items,
    required Money totalAmount,
    required OrderStatus status,
    required DateTime createdAt,
    DateTime? confirmedAt,
    DateTime? completedAt,
    String? notes,
  }) = _Order;
}
```

**Statuts:**
- `pending`: En attente
- `confirmed`: Confirmée
- `cancelled`: Annulée
- `completed`: Complétée

**Méthodes:**
- `canBeModified`: Peut être modifiée
- `canBeCancelled`: Peut être annulée

### 🏷️ 5. Category (Catégorie)

```dart
@freezed
class Category with _$Category {
  const factory Category({
    required String id,
    required String name,
    String? description,
    String? emoji,
    CategoryType type,
    int displayOrder,
    bool isActive,
  }) = _Category;
}
```

**Types:**
- `product`: Catégorie de produits
- `merchant`: Catégorie de commerçants
- `service`: Catégorie de services
- `event`: Catégorie d'événements

### 📊 6. DashboardSummary

```dart
@freezed
class DashboardSummary with _$DashboardSummary {
  const factory DashboardSummary({
    required int totalRevenue,
    required int todayRevenue,
    required int activeProducts,
    required int totalOrders,
    required int pendingOrders,
    required double averageRating,
    required int totalReviews,
  }) = _DashboardSummary;
}
```

**Propriétés calculées:**
- `formattedRevenue`: Revenus formatés
- `formattedRating`: Note formatée

---

## 💎 Value Objects

### 📍 GeoLocation

Géolocalisation avec validation.

```dart
@freezed
class GeoLocation with _$GeoLocation {
  const factory GeoLocation({
    required double latitude,
    required double longitude,
    double? accuracyMeters,
  }) = _GeoLocation;
  
  factory GeoLocation.validated({
    required double latitude,
    required double longitude,
    double? accuracyMeters,
  });
}
```

**Validation:**
- Latitude: -90 à 90
- Longitude: -180 à 180
- Précision >= 0

**Méthodes:**
- `isValid`: Vérifier validité
- `coordinates`: Format "lat,lng"

### 💰 Money

Montant monétaire en **centimes** pour éviter les erreurs de précision.

```dart
@freezed
class Money with _$Money {
  const factory Money({
    required int amountMinor,  // Centimes
    String currencyCode,       // 'EUR', 'USD', etc.
  }) = _Money;
  
  factory Money.fromDecimal({
    required double amount,
    String currencyCode = 'EUR',
  });
}
```

**Opérateurs:**
- `+`: Addition
- `-`: Soustraction
- `*`: Multiplication
- `compareTo`: Comparaison

**Propriétés:**
- `amountDecimal`: Montant en euros
- `formatted`: Format "€10.50"
- `isZero`: Est zéro
- `isPositive`: Est positif

### ⭐ RatingValue

Note avec validation (1-5 étoiles).

```dart
@freezed
class RatingValue with _$RatingValue {
  const factory RatingValue({
    required int value,
  }) = _RatingValue;
  
  factory RatingValue.validated(int value);
}
```

**Validation:**
- Valeur: 1 à 5

**Propriétés:**
- `stars`: "★★★★★"
- `description`: "Excellent", "Bien", etc.

### 🖼️ ImageUrl

URL d'image avec métadonnées.

```dart
@freezed
class ImageUrl with _$ImageUrl {
  const factory ImageUrl({
    required String url,
    bool isPrimary,
    String? alt,
    int? width,
    int? height,
  }) = _ImageUrl;
}
```

**Validation:**
- URL valide (scheme + authority)
- Dimensions positives

### ⏰ TimeRange

Plage horaire (format HH:mm).

```dart
@freezed
class TimeRange with _$TimeRange {
  const factory TimeRange({
    required String start,
    required String end,
  }) = _TimeRange;
}
```

**Méthodes:**
- `durationMinutes`: Durée en minutes
- `containsTime`: Vérifie si une heure est dans la plage

---

## 📝 Énumérations

### 🏪 MerchantType (19 types)

```dart
enum MerchantType {
  restaurant,    // 🍽️
  boulangerie,   // 🥖
  patisserie,    // 🧁
  supermarche,   // 🛒
  epicerie,      // 🏪
  cafe,          // ☕
  traiteur,      // 🍱
  primeur,       // 🥬
  boucherie,     // 🥩
  charcuterie,   // 🥓
  poissonnerie,  // 🐟
  fromagerie,    // 🧀
  chocolaterie,  // 🍫
  glaciere,      // 🍦
  pizzeria,      // 🍕
  fastFood,      // 🍔
  biologique,    // 🌱
  vegan,         // 🌿
  autre,         // 🏬
}
```

### 📦 ProductStatus

```dart
enum ProductStatus {
  available,   // ✅ Disponible
  'sold-out',  // ❌ Épuisé
  scheduled,   // ⏰ Programmé
  expired,     // ⏱️ Expiré
  archived,    // 📦 Archivé
}
```

### 💰 PriceLevel

```dart
enum PriceLevel {
  low,      // € Économique
  medium,   // €€ Modéré
  high,     // €€€ Élevé
  premium,  // €€€€ Premium
}
```

### 🥗 DietaryTag (12 tags)

```dart
enum DietaryTag {
  vegetarian,  // 🥬 Végétarien
  vegan,       // 🌱 Vegan
  glutenFree,  // 🌾 Sans gluten
  dairyFree,   // 🥛 Sans lactose
  nutFree,     // 🥜 Sans noix
  sugarFree,   // 🍯 Sans sucre
  organic,     // 🌿 Bio
  halal,       // 🕌 Halal
  kosher,      // ✡️ Casher
  lowCalorie,  // ⚖️ Faible calorie
  highProtein, // 💪 Riche en protéines
  local,       // 📍 Local
}
```

### 🛒 OrderStatus

```dart
enum OrderStatus {
  pending,    // ⏳ En attente
  confirmed,  // ✅ Confirmée
  cancelled,  // ❌ Annulée
  completed,  // 🏁 Complétée
}
```

### 📊 SortBy

```dart
enum SortBy {
  distance,      // Distance
  rating,        // Note
  price,         // Prix
  availability,  // Disponibilité
  alphabetical,  // Alphabétique
  newest,        // Plus récent
  popularity,    // Popularité
}
```

---

## 🚨 Exceptions du Domaine

### Hiérarchie des Exceptions

```dart
abstract class MerchantException implements Exception
├── MerchantNotFoundException
├── MerchantValidationException
├── MerchantPermissionException
├── MerchantNetworkException
├── MerchantRateLimitException
├── MerchantRatingNotAllowedException
├── MerchantProductUnavailableException
├── MerchantProductNotFoundException
├── InvalidLocationException
├── MerchantUploadException
├── InvalidSearchException
├── CategoryNotFoundException
├── CategoryAlreadyExistsException
├── CategoryInUseException
├── CategoryHierarchyException
└── UnknownMerchantException

abstract class OrderException implements Exception
├── OrderNotFoundException
├── OrderPermissionException
├── OrderInvalidStatusException
└── OrderNetworkException
```

### Exemples d'utilisation

```dart
// Validation
if (latitude < -90 || latitude > 90) {
  throw const InvalidLocationException(
    'Latitude doit être entre -90 et 90',
  );
}

// Recherche
final merchant = await repository.getMerchantById(id);
if (merchant == null) {
  throw const MerchantNotFoundException('Commerçant introuvable');
}

// Permissions
if (!hasPermission) {
  throw const MerchantPermissionException(
    'Autorisation insuffisante',
  );
}
```

---

## 🔍 Filtres de Recherche

### MerchantFilters

Filtres multi-critères pour rechercher des commerçants.

```dart
@freezed
class MerchantFilters with _$MerchantFilters {
  const factory MerchantFilters({
    String? query,
    Set<MerchantType> types,
    double? minRating,
    bool hasAvailableProducts,
    double? maxDistanceKm,
    Set<String> dietaryTags,
    Set<PriceLevel> priceLevels,
    bool isSurpriseBoxOnly,
    double? minDiscount,
    Set<String> categories,
  }) = _MerchantFilters;
}
```

**Factories:**

```dart
// Filtres vides
MerchantFilters.empty()

// Recherche à proximité
MerchantFilters.nearby(maxDistanceKm: 5.0)

// Par type
MerchantFilters.byType(MerchantType.boulangerie)

// Paniers mystère
MerchantFilters.surpriseBoxes()
```

**Propriétés:**
- `isEmpty`: Aucun filtre actif
- `activeFilterCount`: Nombre de filtres actifs

### ProductFilters

Filtres pour les produits anti-gaspillage.

```dart
@freezed
class ProductFilters with _$ProductFilters {
  const factory ProductFilters({
    String? query,
    Set<String> categories,
    Set<String> dietaryTags,
    Set<String> allergenTags,
    double? minDiscount,
    double? maxPrice,
    bool isSurpriseBoxOnly,
    bool availableNow,
    DateTime? pickupAfter,
    DateTime? pickupBefore,
  }) = _ProductFilters;
}
```

**Factories:**

```dart
// Recherche rapide
ProductFilters.quickSearch("pain")

// Paniers mystère
ProductFilters.surpriseBoxes()
```

### ProximitySearchQuery

Requête de recherche par proximité complète.

```dart
@freezed
class ProximitySearchQuery with _$ProximitySearchQuery {
  const factory ProximitySearchQuery({
    required GeoLocation center,
    double radiusKm,
    MerchantFilters filters,
    SortOptions sort,
    int limit,
    int offset,
  }) = _ProximitySearchQuery;
}
```

**Factories:**

```dart
// Recherche simple
ProximitySearchQuery.simple(
  center: userLocation,
  radiusKm: 5.0,
)

// Recherche urgente
ProximitySearchQuery.urgent(
  center: userLocation,
  radiusKm: 3.0,
)
```

---

## 🎯 Use Cases (31 fichiers)

### Gestion des Commerçants

```dart
// Récupération
GetMerchantByIdUseCase
SearchNearbyMerchantsUseCase
GetMerchantsByCategoryUseCase

// CRUD
CreateMerchantUseCase (via registration)
UpdateMerchantUseCase
DeleteMerchantUseCase

// Vérification
VerifyMerchantUseCase
SuspendMerchantUseCase

// Favoris
FollowMerchantUseCase
GetFollowedMerchantsUseCase

// Notation
RateMerchantUseCase
GetMerchantRatingsUseCase
```

### Gestion des Produits

```dart
// CRUD
CreateProductUseCase
AddProductUseCase
UpdateProductUseCase
DeleteProductUseCase

// Consultation
GetProductsUseCase
GetMerchantProductsUseCase
SearchProductsUseCase

// Gestion
ToggleProductStatusUseCase
```

### Gestion des Commandes

```dart
GetOrdersByStoreUseCase
UpdateOrderStatusUseCase
```

### Dashboard & Statistiques

```dart
GetDashboardSummaryUseCase
GetMerchantStatisticsUseCase
GetMerchantSalesStatsUseCase
```

### Gestion des Catégories

```dart
CategoryUsecases (fichier unique):
- GetCategories
- CreateCategory
- UpdateCategory
- DeleteCategory
```

### Utilitaires

```dart
GeocodeMerchantAddressUseCase  // Géocoder une adresse
SettingsUsecases               // Paramètres
UtilityUsecases               // Utilitaires divers
```

### Inscription

```dart
CompleteMerchantRegistrationUseCase
CompleteMerchantOnboardingUseCase
```

---

## 🛠️ Services du Domaine

### 📍 DistanceService

Service de calculs géographiques.

```dart
class DistanceService {
  // Calcul de distance (formule de Haversine)
  double distanceKm(GeoLocation point1, GeoLocation point2);
  
  // Direction cardinale
  String getCardinalDirection(GeoLocation from, GeoLocation to);
  
  // Bearing (angle)
  double calculateBearing(GeoLocation from, GeoLocation to);
  
  // Tri par proximité
  List<T> sortByProximity<T>(
    List<T> items,
    GeoLocation center,
    double Function(T) getLatitude,
    double Function(T) getLongitude,
  );
  
  // Formatage de distance
  String formatDistance(double km);
  
  // Bounding box
  ({double north, double south, double east, double west}) 
    getBoundingBox(GeoLocation center, double radiusKm);
}
```

**Exemples:**

```dart
final service = DistanceService();
final paris = GeoLocation.validated(
  latitude: 48.8566, 
  longitude: 2.3522,
);
final lyon = GeoLocation.validated(
  latitude: 45.7640, 
  longitude: 4.8357,
);

// Distance
final distance = service.distanceKm(paris, lyon);
print(service.formatDistance(distance)); // "392 km"

// Direction
final direction = service.getCardinalDirection(paris, lyon);
print(direction); // "Sud"
```

### 🏷️ CategoryService

Service de gestion des catégories.

```dart
class CategoryService {
  Future<List<Category>> getCategories(CategoryType type);
  Future<Category> createCategory(Category category);
  Future<void> updateCategory(Category category);
  Future<void> deleteCategory(String categoryId);
}
```

---

## 📦 Repositories (Interfaces)

### MerchantRepository

```dart
abstract class MerchantRepository {
  // CRUD
  Future<Merchant?> getMerchantById(String id);
  Future<void> createMerchant(Merchant merchant);
  Future<void> updateMerchant(Merchant merchant);
  Future<void> deleteMerchant(String id);
  
  // Recherche
  Future<List<Merchant>> searchNearby(ProximitySearchQuery query);
  Future<List<Merchant>> searchMerchants(MerchantFilters filters);
  Future<List<Merchant>> getMerchantsByCategory(String categoryId);
  
  // Favoris
  Future<void> followMerchant(String userId, String merchantId);
  Future<void> unfollowMerchant(String userId, String merchantId);
  Future<List<Merchant>> getFollowedMerchants(String userId);
  
  // Notation
  Future<void> rateMerchant(Rating rating);
  Future<List<Rating>> getMerchantRatings(String merchantId);
  Future<RatingSummary> getRatingSummary(String merchantId);
  
  // Statistiques
  Future<DashboardSummary> getDashboardSummary(String merchantId);
  Future<MerchantStatistics> getStatistics(String merchantId);
}
```

### ProductRepository

```dart
abstract class ProductRepository {
  // CRUD
  Future<Product?> getProductById(String id);
  Future<void> createProduct(Product product);
  Future<void> updateProduct(Product product);
  Future<void> deleteProduct(String id);
  
  // Recherche
  Future<List<Product>> getProducts(String merchantId);
  Future<List<Product>> searchProducts(ProductFilters filters);
  
  // Gestion
  Future<void> toggleProductStatus(String id, bool isActive);
}
```

### OrderRepository

```dart
abstract class OrderRepository {
  // CRUD
  Future<Order?> getOrderById(String id);
  Future<void> createOrder(Order order);
  Future<void> updateOrder(Order order);
  
  // Recherche
  Future<List<Order>> getOrdersByStore(String merchantId);
  Future<List<Order>> getOrdersByUser(String userId);
  
  // Gestion
  Future<void> updateOrderStatus(String id, OrderStatus status);
}
```

### CategoryRepository

```dart
abstract class CategoryRepository {
  Future<List<Category>> getCategories(CategoryType type);
  Future<Category?> getCategoryById(String id);
  Future<void> createCategory(Category category);
  Future<void> updateCategory(Category category);
  Future<void> deleteCategory(String id);
}
```

---

## 🎓 Exemples d'Utilisation

### Créer un Produit Anti-gaspillage

```dart
final product = MerchantProduct.validated(
  id: 'prod_123',
  merchantId: 'merchant_456',
  title: 'Panier de viennoiseries',
  originalPrice: Money.fromDecimal(amount: 15.0),
  discountedPrice: Money.fromDecimal(amount: 4.99),
  quantity: 3,
  pickupStart: DateTime.now().add(Duration(hours: 1)),
  pickupEnd: DateTime.now().add(Duration(hours: 3)),
  dietaryTags: ['vegetarian'],
  isSurpriseBox: true,
);

print('Réduction: ${product.discountPercentage}%'); // 66.7%
print('Économies: ${product.savingsAmount.formatted}'); // €10.01
```

### Recherche Géographique

```dart
final distanceService = DistanceService();
final repository = ref.read(merchantRepositoryProvider);

final query = ProximitySearchQuery.simple(
  center: GeoLocation.validated(
    latitude: 48.8566,
    longitude: 2.3522,
  ),
  radiusKm: 5.0,
);

final merchants = await repository.searchNearby(query);
```

### Filtres Avancés

```dart
final filters = MerchantFilters.nearby(maxDistanceKm: 5.0).copyWith(
  types: {MerchantType.boulangerie, MerchantType.patisserie},
  minRating: 4.0,
  hasAvailableProducts: true,
  dietaryTags: {'vegan'},
);

print('Filtres actifs: ${filters.activeFilterCount}');
```

### Use Case en Action

```dart
// Récupérer un commerçant
final getMerchantUseCase = GetMerchantByIdUseCase(repository);
final merchant = await getMerchantUseCase.execute('merchant_123');

// Noter un commerçant
final rateUseCase = RateMerchantUseCase(repository);
await rateUseCase.execute(
  userId: 'user_456',
  merchantId: 'merchant_123',
  rating: 5,
  comment: 'Excellent service!',
);
```

---

## ✅ Principes DDD Respectés

### Domain Purity
- ✅ Aucune dépendance vers l'infrastructure
- ✅ Aucune dépendance vers l'UI
- ✅ Logique métier centralisée

### Invariants Métier
- ✅ Validation dans les factories
- ✅ Prix réduit < prix original
- ✅ Coordonnées géographiques valides
- ✅ Notes entre 1-5 étoiles

### Aggregate Design
- ✅ `Merchant` comme agrégat principal
- ✅ `MerchantProduct` comme entité
- ✅ Boundaries claires

### Value Objects Immutables
- ✅ `Money`, `GeoLocation`, `TimeRange`
- ✅ Égalité structurelle via Freezed
- ✅ Factory methods avec validation

---

## 🔧 Génération de Code

```bash
# Générer tous les fichiers .freezed.dart et .g.dart
dart run build_runner build --delete-conflicting-outputs

# Watch mode (développement)
dart run build_runner watch
```

---

## 📚 Ressources Complémentaires

- [README.md](./README.md) - Vue d'ensemble initiale
- [REACT_CONVERSION.md](./REACT_CONVERSION.md) - Conversion vers React
- [REACT_API_MAPPING.md](./REACT_API_MAPPING.md) - Mapping des API

---

Cette couche domain constitue le **cœur métier robuste** de la fonctionnalité commerçants anti-gaspillage, prête à être étendue avec les couches data et presentation.

