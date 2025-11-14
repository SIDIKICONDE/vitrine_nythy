/**
 * ProductCard - Carte produit anti-gaspillage
 */

import Image from 'next/image';
import Link from 'next/link';

interface Money {
  amountMinor: number;
  currencyCode: string;
}

interface Product {
  id: string;
  merchantId: string;
  title: string;
  description?: string;
  originalPrice: Money;
  discountedPrice: Money;
  quantity: number;
  pickupStart: Date;
  pickupEnd: Date;
  imageUrls: string[];
  isSurpriseBox: boolean;
  dietaryTags?: string[];
  status: string;
  weightGrams?: number;
  co2SavedGrams?: number;
}

interface ProductCardProps {
  product: Product;
  merchantName?: string;
  merchantBannerUrl?: string;
  merchantLogoUrl?: string;
  showMerchant?: boolean;
}

export default function ProductCard({
  product,
  merchantName,
  merchantBannerUrl,
  merchantLogoUrl,
  showMerchant = false
}: ProductCardProps) {
  // Formatage des prix
  const formatPrice = (money: Money) => {
    const amount = money.amountMinor / 100;
    return `${amount.toFixed(2)}€`;
  };

  // Formatage de l'heure de retrait (extrait l'heure locale comme Flutter .toLocal())
  const formatPickupTime = (date: Date) => {
    // S'assurer que c'est un Date object
    const d = date instanceof Date ? date : new Date(date);
    // Extraire l'heure et les minutes en heure locale (JavaScript fait automatiquement la conversion UTC→Locale)
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const isAvailable = product.status === 'available' && product.quantity > 0;

  return (
    <Link href={`/merchant/products/${product.id}`}>
      <div className={`
        liquid-glass hover:shadow-custom-xl transition-all duration-300 
        group cursor-pointer overflow-hidden h-full flex flex-col rounded-xl
        ${!isAvailable ? 'opacity-60' : ''}
      `}>
        {/* Image */}
        <div className="relative h-48 bg-linear-to-br from-primary/10 to-secondary/10 overflow-hidden -m-[21px] mb-0 rounded-xl">
          {/* Banner du marchand en arrière-plan (si pas d'image produit) */}
          {!product.imageUrls?.[0] && merchantBannerUrl && (
            <Image
              src={merchantBannerUrl}
              alt={merchantName || 'Banner marchand'}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover z-0"
            />
          )}

          {/* Image du produit */}
          {product.imageUrls?.[0] && (
            <Image
              src={product.imageUrls[0]}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300 z-10"
            />
          )}

          {/* Badge surprise box */}
          {product.isSurpriseBox && (
            <div className="absolute top-2 right-2 bg-primary text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-20">
              🎁 Surprise
            </div>
          )}

          {/* Badge stock faible */}
          {isAvailable && product.quantity <= 3 && (
            <div className="absolute bottom-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg z-20">
              Plus que {product.quantity}
            </div>
          )}

          {/* Logo du marchand en bas à gauche */}
          {merchantLogoUrl && isAvailable && (
            <div className="absolute bottom-2 left-2 w-12 h-12 bg-white rounded-full shadow-lg overflow-hidden z-20">
              <Image
                src={merchantLogoUrl}
                alt={merchantName || 'Logo marchand'}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
          )}

          {/* Badge épuisé (remplace le logo quand épuisé) */}
          {!isAvailable && (
            <div className="absolute bottom-2 left-2 bg-gray-800 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg z-20">
              Épuisé
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 flex-1 flex flex-col">
          {/* Merchant name */}
          {showMerchant && merchantName && (
            <p className="text-xs text-foreground-muted mb-0.5">
              📍 {merchantName}
            </p>
          )}

          {/* Title */}
          <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors mb-0.5 line-clamp-2">
            {product.title}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-foreground-muted line-clamp-2 mb-2">
              {product.description}
            </p>
          )}

          {/* Tags diététiques */}
          {product.dietaryTags && product.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.dietaryTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Impact environnemental */}
          {product.co2SavedGrams && product.co2SavedGrams > 0 && (
            <div className="flex items-center gap-1 text-xs text-green-600 mb-2">
              <span>🌱</span>
              <span>
                Économise{' '}
                {product.co2SavedGrams >= 1000
                  ? `${(product.co2SavedGrams / 1000).toFixed(1)}kg`
                  : `${product.co2SavedGrams}g`}{' '}
                de CO₂
              </span>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Prix */}
          <div className="mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {formatPrice(product.discountedPrice)}
              </span>
              <span className="text-sm text-foreground-muted line-through">
                {formatPrice(product.originalPrice)}
              </span>
            </div>
          </div>

          {/* Horaire de retrait */}
          <div className="text-xs text-foreground-muted border-t border-border pt-1.5">
            ⏰ Retrait : {formatPickupTime(product.pickupStart)} - {formatPickupTime(product.pickupEnd)}
          </div>
        </div>
      </div>
    </Link>
  );
}

