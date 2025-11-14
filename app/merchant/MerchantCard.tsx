/**
 * MerchantCard - Carte d'affichage d'un marchand
 */

import Image from 'next/image';
import Link from 'next/link';
import { Merchant } from '@/types/merchant';
import { MerchantTypeLabels } from '@/types/merchant-enums';

interface MerchantCardProps {
  merchant: Merchant;
  showDistance?: boolean;
}

export default function MerchantCard({ merchant, showDistance = false }: MerchantCardProps) {
  const {
    id,
    businessName,
    merchantType,
    description,
    logoUrl,
    bannerUrl,
    stats,
    address,
    priceLevel
  } = merchant;

  // Distance pourrait être calculée depuis les coordonnées si nécessaire
  // const distance = calculateDistance(userLat, userLng, address.location.latitude, address.location.longitude);
  const distance = null; // Désactivé pour l'instant

  return (
    <Link href={`/merchant/${id}`}>
      <div className="liquid-glass hover:shadow-custom-xl transition-all duration-300 group cursor-pointer overflow-hidden">
        {/* Banner */}
        <div className="relative h-40 bg-linear-to-br from-primary/20 to-secondary/20 overflow-hidden">
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt={businessName}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className="text-6xl opacity-20">🏪</span>
            </div>
          )}

          {/* Logo overlay */}
          {logoUrl && (
            <div className="absolute bottom-0 left-4 transform translate-y-1/2">
              <div className="w-20 h-20 rounded-full border-4 border-surface bg-white shadow-lg overflow-hidden">
                <Image
                  src={logoUrl}
                  alt={businessName}
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 pt-12">
          {/* Header */}
          <div className="mb-2">
            <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
              {businessName}
            </h3>
            <p className="text-sm text-foreground-muted">
              {MerchantTypeLabels[merchantType]}
              {priceLevel && ` • ${priceLevel}`}
            </p>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-foreground-muted line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-foreground-muted mb-3">
            {/* Rating */}
            {stats.averageRating > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">⭐</span>
                <span className="font-medium">{stats.averageRating.toFixed(1)}</span>
                <span>({stats.totalReviews})</span>
              </div>
            )}

            {/* Distance */}
            {showDistance && distance && (
              <div className="flex items-center gap-1">
                <span>📍</span>
                <span>{distance}</span>
              </div>
            )}

            {/* CO2 Saved */}
            {stats.co2Saved > 0 && (
              <div className="flex items-center gap-1">
                <span>🌱</span>
                <span>{stats.co2Saved}kg CO₂</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="text-sm text-foreground-muted">
              {stats.productsCount} produits disponibles
            </div>
            <div className="text-sm font-medium text-primary group-hover:text-secondary transition-colors">
              Voir plus →
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

