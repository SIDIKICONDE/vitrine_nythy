/**
 * Export centralisé des composants merchant
 */

// Composants de base
export { default as MerchantCard } from './MerchantCard';
export { default as MerchantList } from './MerchantList';
export { default as MerchantStats } from './MerchantStats';
export { default as ProductCard } from './ProductCard';

// Layout
export { default as MerchantHeader } from './MerchantHeader';
export { default as MerchantSidebar } from './MerchantSidebar';

// Auth
export { default as MerchantLoginForm } from './auth/MerchantLoginForm';

// Composants dashboard
export { default as DashboardStats } from './dashboard/DashboardStats';
export { default as QuickActions } from './dashboard/QuickActions';
export { default as RecentOrders } from './dashboard/RecentOrders';
export { default as ActivityFeed } from './dashboard/ActivityFeed';
export { default as PerformanceChart } from './dashboard/PerformanceChart';
export { default as TopProducts } from './dashboard/TopProducts';

// Composants produits
export { default as ProductForm } from './products/ProductForm';
export { default as ProductList } from './products/ProductList';

