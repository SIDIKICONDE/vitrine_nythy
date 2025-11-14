/**
 * PricingSection - Section tarification anti-gaspillage
 * Aligné sur Flutter (pricing_section.dart)
 */

'use client';

import { useState } from 'react';

interface PricingSectionProps {
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  maxPerUser: number | null;
  onOriginalPriceChange: (value: number) => void;
  onDiscountedPriceChange: (value: number) => void;
  onQuantityChange: (value: number) => void;
  onMaxPerUserChange: (value: number | null) => void;
}

export default function PricingSection({
  originalPrice,
  discountedPrice,
  quantity,
  maxPerUser,
  onOriginalPriceChange,
  onDiscountedPriceChange,
  onQuantityChange,
  onMaxPerUserChange,
}: PricingSectionProps) {
  const [originalPriceStr, setOriginalPriceStr] = useState(originalPrice.toString());
  const [discountedPriceStr, setDiscountedPriceStr] = useState(discountedPrice.toString());
  const [quantityStr, setQuantityStr] = useState(quantity.toString());
  const [maxPerUserStr, setMaxPerUserStr] = useState(maxPerUser?.toString() || '');

  // Calculer la réduction
  const saving = originalPrice > 0 && discountedPrice < originalPrice
    ? originalPrice - discountedPrice
    : 0;
  const savingPercent = originalPrice > 0
    ? Math.round((saving / originalPrice) * 100)
    : 0;

  // Validation des prix
  const hasPriceError = originalPrice > 0 && discountedPrice > 0 && discountedPrice >= originalPrice;

  const handleOriginalPriceChange = (value: string) => {
    // Permettre seulement les nombres avec 2 décimales max
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setOriginalPriceStr(cleaned);
    const num = parseFloat(cleaned) || 0;
    onOriginalPriceChange(num);
  };

  const handleDiscountedPriceChange = (value: string) => {
    const cleaned = value.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;

    setDiscountedPriceStr(cleaned);
    const num = parseFloat(cleaned) || 0;
    onDiscountedPriceChange(num);
  };

  const handleQuantityChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setQuantityStr(cleaned);
    const num = parseInt(cleaned) || 0;
    onQuantityChange(num);
  };

  const handleMaxPerUserChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    setMaxPerUserStr(cleaned);
    const num = cleaned ? parseInt(cleaned) : null;
    onMaxPerUserChange(num);
  };

  return (
    <div className="liquid-glass relative z-10 p-6 space-y-4">
      <h3 className="text-lg font-bold text-primary mb-4">
        Tarification anti-gaspillage
      </h3>

      {/* Prix original */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Prix original (€) *
        </label>
        <div className="relative">
          <input
            type="text"
            value={originalPriceStr}
            onChange={(e) => handleOriginalPriceChange(e.target.value)}
            placeholder="0.00"
            required
            className="w-full px-4 py-3 pl-11 pr-12 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">€</span>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">€</span>
        </div>
        <p className="text-xs text-foreground-muted mt-1">
          Prix initial du produit
        </p>
      </div>

      {/* Prix réduit */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Prix réduit anti-gaspillage (€) *
        </label>
        <div className="relative">
          <input
            type="text"
            value={discountedPriceStr}
            onChange={(e) => handleDiscountedPriceChange(e.target.value)}
            placeholder="0.00"
            required
            className="w-full px-4 py-3 pl-11 pr-12 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">€</span>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">€</span>
        </div>
        <p className="text-xs text-foreground-muted mt-1">
          Prix de vente anti-gaspillage
        </p>
      </div>

      {/* Calcul de la réduction */}
      {originalPrice > 0 && discountedPrice > 0 && (
        <div>
          {hasPriceError ? (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-red-700 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold">Erreur : Le prix réduit doit être inférieur au prix original</p>
                  <p className="text-sm mt-1">
                    Prix réduit ({discountedPrice.toFixed(2)}€) doit être &lt; Prix original ({originalPrice.toFixed(2)}€)
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="font-semibold">
                  💰 Économie de {saving.toFixed(2)}€ ({savingPercent}% de réduction)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border pt-4 mt-4"></div>

      {/* Quantité disponible */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Quantité disponible *
        </label>
        <div className="relative">
          <input
            type="text"
            value={quantityStr}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder="0"
            required
            className="w-full px-4 py-3 pl-11 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-xs text-foreground-muted mt-1">
          Nombre de produits disponibles
        </p>
      </div>

      {/* Limite par utilisateur */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Limite par client (optionnelle)
        </label>
        <div className="relative">
          <input
            type="text"
            value={maxPerUserStr}
            onChange={(e) => handleMaxPerUserChange(e.target.value)}
            placeholder="Ex: 2"
            className="w-full px-4 py-3 pl-11 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <p className="text-xs text-foreground-muted mt-1">
          Nombre maximum de produits par client
        </p>
      </div>
    </div>
  );
}

