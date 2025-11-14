/**
 * Entité: Product
 * Produit générique
 */

export interface ProductData {
  id: string;
  merchantId: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  originalPrice?: number;
  imageUrl?: string;
  images: string[];
  isActive: boolean;
  quantity: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product {
  constructor(
    public readonly id: string,
    public readonly merchantId: string,
    public readonly name: string,
    public readonly description?: string,
    public readonly category?: string,
    public readonly price: number = 0,
    public readonly originalPrice?: number,
    public readonly imageUrl?: string,
    public readonly images: string[] = [],
    public readonly isActive: boolean = true,
    public readonly quantity: number = 0,
    public readonly createdAt?: Date,
    public readonly updatedAt?: Date
  ) {
    this.validate();
  }

  /**
   * Factory method depuis un objet ProductData
   */
  static from(data: ProductData): Product {
    return new Product(
      data.id,
      data.merchantId,
      data.name,
      data.description,
      data.category,
      data.price,
      data.originalPrice,
      data.imageUrl,
      data.images,
      data.isActive,
      data.quantity,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Validation
   */
  private validate(): void {
    if (this.price < 0) {
      throw new Error('Le prix doit être positif');
    }
    if (this.originalPrice !== undefined && this.originalPrice < 0) {
      throw new Error('Le prix original doit être positif');
    }
    if (this.quantity < 0) {
      throw new Error('La quantité doit être positive');
    }
  }

  /**
   * Pourcentage de réduction (si prix original défini)
   */
  get discountPercentage(): number | undefined {
    if (this.originalPrice === undefined) {
      return undefined;
    }
    return Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  }

  /**
   * Toutes les images (imageUrl + images)
   */
  get allImages(): string[] {
    const images = [...this.images];
    if (this.imageUrl && !images.includes(this.imageUrl)) {
      images.unshift(this.imageUrl);
    }
    return images;
  }

  /**
   * En stock
   */
  get inStock(): boolean {
    return this.quantity > 0 && this.isActive;
  }

  /**
   * Convertir en objet simple
   */
  toJSON(): ProductData {
    return {
      id: this.id,
      merchantId: this.merchantId,
      name: this.name,
      description: this.description,
      category: this.category,
      price: this.price,
      originalPrice: this.originalPrice,
      imageUrl: this.imageUrl,
      images: this.images,
      isActive: this.isActive,
      quantity: this.quantity,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

