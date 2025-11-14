/**
 * Repository: ProductRepository
 * Interface pour la persistance des produits
 */

import { Product } from '../entities/Product';
import { MerchantProduct } from '../entities/MerchantProduct';
import { ProductFilters } from '../filters/ProductFilters';

export interface ProductRepository {
  // CRUD
  getProductById(id: string): Promise<Product | null>;
  createProduct(product: Product): Promise<void>;
  createMerchantProduct(product: MerchantProduct): Promise<void>;
  updateProduct(product: Product): Promise<void>;
  deleteProduct(id: string): Promise<void>;

  // Recherche
  getProducts(merchantId: string): Promise<Product[]>;
  getMerchantProducts(merchantId: string): Promise<MerchantProduct[]>;
  searchProducts(filters: ProductFilters): Promise<MerchantProduct[]>;

  // Gestion
  toggleProductStatus(id: string, isActive: boolean): Promise<void>;
}

