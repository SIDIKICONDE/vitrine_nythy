/**
 * ProductForm - Formulaire de création/édition de produit
 * Aligné exactement sur Flutter (add_product_page_new.dart)
 */

'use client';

import { useEffect, useState } from 'react';
import { getDefaultEnvironmentalImpact } from '../domain/services/EnvironmentalImpactService';
import DatesSection from './sections/DatesSection';
import PricingSection from './sections/PricingSection';
import ProductInfoSection from './sections/ProductInfoSection';
import TagsSection from './sections/TagsSection';

interface ProductFormData {
  title: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  quantity: number;
  maxPerUser: number | null;
  pickupStart: string;
  pickupEnd: string;
  expirationDate: string | null;
  dietaryTags: string[];
  allergenTags: string[];
  isSurpriseBox: boolean;
  category: string;
  subcategory: string | null;
  weightGrams?: number;
  co2SavedGrams?: number;
  pickupInstructions?: string;
  surpriseDescription?: string;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isEditing?: boolean;
}

export default function ProductForm({ initialData, onSubmit, isEditing = false }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    originalPrice: initialData?.originalPrice || 0,
    discountedPrice: initialData?.discountedPrice || 0,
    quantity: initialData?.quantity || 1,
    maxPerUser: initialData?.maxPerUser || null,
    pickupStart: initialData?.pickupStart || '',
    pickupEnd: initialData?.pickupEnd || '',
    expirationDate: initialData?.expirationDate || null,
    dietaryTags: initialData?.dietaryTags || [],
    allergenTags: initialData?.allergenTags || [],
    isSurpriseBox: initialData?.isSurpriseBox || false,
    category: initialData?.category || '',
    subcategory: initialData?.subcategory || null,
    weightGrams: initialData?.weightGrams,
    co2SavedGrams: initialData?.co2SavedGrams,
    pickupInstructions: initialData?.pickupInstructions,
    surpriseDescription: initialData?.surpriseDescription || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-remplir l'impact environnemental quand la catégorie change
  useEffect(() => {
    if (formData.category) {
      const defaults = getDefaultEnvironmentalImpact(formData.category);

      // Ne remplir que si les champs sont vides ou ont des valeurs très petites (<50g)
      setFormData(prev => ({
        ...prev,
        weightGrams: prev.weightGrams && prev.weightGrams >= 50 ? prev.weightGrams : defaults.weightGrams,
        co2SavedGrams: prev.co2SavedGrams && prev.co2SavedGrams >= 50 ? prev.co2SavedGrams : defaults.co2SavedGrams,
      }));
    }
  }, [formData.category]); // Se déclenche quand la catégorie change

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation alignée sur Flutter
      if (!formData.title.trim()) {
        throw new Error('Le titre est requis');
      }
      // Catégorie requise seulement pour les produits normaux
      if (!formData.category && !formData.isSurpriseBox) {
        throw new Error('La catégorie est requise');
      }
      if (formData.originalPrice <= 0) {
        throw new Error('Le prix original doit être supérieur à 0');
      }
      if (formData.discountedPrice <= 0) {
        throw new Error('Le prix réduit doit être supérieur à 0');
      }
      if (formData.discountedPrice >= formData.originalPrice) {
        throw new Error('Le prix réduit doit être inférieur au prix original');
      }
      if (formData.quantity <= 0) {
        throw new Error('La quantité doit être positive');
      }
      if (!formData.pickupStart || !formData.pickupEnd) {
        throw new Error('Les dates de retrait sont requises');
      }
      // Date d'expiration est optionnelle (recommandée mais pas obligatoire)

      // Validation impact environnemental
      if (formData.weightGrams && formData.weightGrams < 50) {
        throw new Error('Le poids doit être d\'au moins 50g (valeurs trop petites ne sont pas réalistes)');
      }
      if (formData.co2SavedGrams && formData.co2SavedGrams < 10) {
        throw new Error('Le CO₂ économisé doit être d\'au moins 10g');
      }

      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-700 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Section Informations produit */}
      <ProductInfoSection
        title={formData.title}
        description={formData.description}
        category={formData.category}
        subcategory={formData.subcategory}
        isSurpriseBox={formData.isSurpriseBox}
        surpriseDescription={formData.surpriseDescription || ''}
        onTitleChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
        onDescriptionChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
        onCategoryChange={(value) => setFormData(prev => ({ ...prev, category: value, subcategory: null }))}
        onSubcategoryChange={(value) => setFormData(prev => ({ ...prev, subcategory: value }))}
        onSurpriseBoxChange={(value) => setFormData(prev => ({ ...prev, isSurpriseBox: value }))}
        onSurpriseDescriptionChange={(value) => setFormData(prev => ({ ...prev, surpriseDescription: value }))}
      />

      {/* Section Tarification */}
      <PricingSection
        originalPrice={formData.originalPrice}
        discountedPrice={formData.discountedPrice}
        quantity={formData.quantity}
        maxPerUser={formData.maxPerUser}
        onOriginalPriceChange={(value) => setFormData(prev => ({ ...prev, originalPrice: value }))}
        onDiscountedPriceChange={(value) => setFormData(prev => ({ ...prev, discountedPrice: value }))}
        onQuantityChange={(value) => setFormData(prev => ({ ...prev, quantity: value }))}
        onMaxPerUserChange={(value) => setFormData(prev => ({ ...prev, maxPerUser: value }))}
      />

      {/* Section Dates */}
      <DatesSection
        pickupStart={formData.pickupStart}
        pickupEnd={formData.pickupEnd}
        expirationDate={formData.expirationDate}
        onPickupStartChange={(value) => setFormData(prev => ({ ...prev, pickupStart: value }))}
        onPickupEndChange={(value) => setFormData(prev => ({ ...prev, pickupEnd: value }))}
        onExpirationDateChange={(value) => setFormData(prev => ({ ...prev, expirationDate: value }))}
      />

      {/* Section Tags */}
      <TagsSection
        dietaryTags={formData.dietaryTags}
        allergenTags={formData.allergenTags}
        onDietaryTagsChange={(tags) => setFormData(prev => ({ ...prev, dietaryTags: tags }))}
        onAllergenTagsChange={(tags) => setFormData(prev => ({ ...prev, allergenTags: tags }))}
        disabled={formData.isSurpriseBox}
      />

      {/* Section Impact environnemental */}
      <div className="liquid-glass p-6 space-y-4">
        <h3 className="text-lg font-bold text-primary mb-4">
          🌱 Impact environnemental
        </h3>

        {formData.isSurpriseBox && (
          <p className="text-xs text-foreground-muted bg-green-50 dark:bg-green-900/20 p-3 rounded-lg mb-4 border border-green-200 dark:border-green-800">
            💡 Pour les paniers surprise, indiquez des <strong>valeurs moyennes estimées</strong>
          </p>
        )}

        {formData.category && !formData.weightGrams && !formData.co2SavedGrams && (
          <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4 border border-blue-200 dark:border-blue-800">
            ✨ <strong>Astuce :</strong> Des valeurs suggérées apparaîtront selon votre catégorie !
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Poids {formData.isSurpriseBox ? '(moyen estimé)' : '(grammes)'}
              {formData.weightGrams && formData.weightGrams > 0 && (
                <span className="ml-2 text-xs text-green-600 font-normal">✓ {formData.weightGrams}g</span>
              )}
            </label>
            <input
              type="number"
              value={formData.weightGrams || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, weightGrams: e.target.value ? parseFloat(e.target.value) : undefined }))}
              min="50"
              step="10"
              placeholder={
                formData.category
                  ? `Suggestion: ${getDefaultEnvironmentalImpact(formData.category).weightGrams}g`
                  : "Ex: 500"
              }
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-foreground-muted mt-1">
              Minimum : 50g
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              CO₂ économisé {formData.isSurpriseBox ? '(moyen estimé)' : '(grammes)'}
              {formData.co2SavedGrams && formData.co2SavedGrams > 0 && (
                <span className="ml-2 text-xs text-green-600 font-normal">✓ {formData.co2SavedGrams}g</span>
              )}
            </label>
            <input
              type="number"
              value={formData.co2SavedGrams || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, co2SavedGrams: e.target.value ? parseFloat(e.target.value) : undefined }))}
              min="10"
              step="10"
              placeholder={
                formData.category
                  ? `Suggestion: ${getDefaultEnvironmentalImpact(formData.category).co2SavedGrams}g`
                  : "Ex: 250"
              }
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-foreground-muted mt-1">
              Calculé automatiquement selon le poids et la catégorie
            </p>
          </div>
        </div>
      </div>

      {/* Instructions de retrait */}
      <div className="liquid-glass p-6 space-y-4">
        <h3 className="text-lg font-bold text-primary mb-4">
          Instructions de retrait
        </h3>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Instructions (optionnelles)
          </label>
          <textarea
            value={formData.pickupInstructions || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, pickupInstructions: e.target.value }))}
            rows={2}
            placeholder={formData.isSurpriseBox ? "Ex: Récupérer votre panier surprise à l'accueil" : "Ex: Se présenter à l'accueil avec le numéro de commande"}
            className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Boutons d'action */}
      <div className="flex gap-4 p-6 bg-surface border border-border rounded-xl">
        <button
          type="button"
          onClick={() => window.history.back()}
          disabled={loading}
          className="flex-1 px-6 py-3 border border-border text-foreground-muted hover:bg-surface-hover rounded-xl transition-colors disabled:opacity-50"
        >
          Annuler
        </button>

        <button
          type="submit"
          disabled={loading}
          className="flex-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Publication en cours...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>{isEditing ? 'Mettre à jour' : 'Publier le produit'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
