/**
 * Export centralisé des use cases
 */

// Use cases existants
export * from './CreateProductUseCase';
export * from './GetDashboardSummaryUseCase';
export * from './GetMerchantByIdUseCase';
export * from './SearchNearbyMerchantsUseCase';
export * from './UpdateOrderStatusUseCase';

// Nouveaux use cases - Products
export * from './AddProductUseCase';
export * from './UpdateProductUseCase';
export * from './DeleteProductUseCase';
export * from './GetProductsUseCase';
export * from './GetMerchantProductsUseCase';
export * from './ToggleProductStatusUseCase';
export * from './SearchProductsUseCase';

// Nouveaux use cases - Merchants
export * from './UpdateMerchantUseCase';
export * from './DeleteMerchantUseCase';
export * from './GetMerchantsByCategoryUseCase';
export * from './FollowMerchantUseCase';
export * from './GetFollowedMerchantsUseCase';
export * from './RateMerchantUseCase';
export * from './GetMerchantRatingsUseCase';
export * from './GetMerchantStatisticsUseCase';
export * from './GetMerchantSalesStatsUseCase';

// Nouveaux use cases - Registration & Onboarding
export * from './CompleteMerchantRegistrationUseCase';
export * from './CompleteMerchantOnboardingUseCase';
export * from './VerifyMerchantUseCase';
export * from './SuspendMerchantUseCase';

// Nouveaux use cases - Orders
export * from './GetOrdersByStoreUseCase';

// Nouveaux use cases - Utilities
export * from './GeocodeMerchantAddressUseCase';
export * from './CategoryUsecases';
export * from './SettingsUsecases';
export * from './UtilityUsecases';

// Nouveaux use cases - Finance
export * from './GetFinanceSummaryUseCase';
export * from './GetTransactionsUseCase';
export * from './GetPayoutsUseCase';