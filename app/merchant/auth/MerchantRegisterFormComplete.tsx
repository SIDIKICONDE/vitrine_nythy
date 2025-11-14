/**
 * MerchantRegisterFormComplete - Formulaire d'inscription marchand complet
 * Aligné avec merchant_registration_page.dart et le domaine DDD
 */

'use client';

import { MerchantType, MerchantTypeLabels } from '@/app/merchant/domain/enums';
import { createAuthHeaders } from '@/lib/csrf-client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface FormData {
  email: string;
  password: string;
  storeName: string;
  merchantType: MerchantType;
  address: string;
  postalCode: string;
  city: string;
  description: string;
}

interface GeocodeResult {
  latitude: number;
  longitude: number;
}

export default function MerchantRegisterFormComplete() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    storeName: '',
    merchantType: MerchantType.RESTAURANT,
    address: '',
    postalCode: '',
    city: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [obscurePassword, setObscurePassword] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): string | null => {
    // Email
    if (!formData.email || !formData.email.includes('@')) {
      return 'Veuillez entrer une adresse email valide';
    }

    // Mot de passe (minimum 12 caractères comme dans Dart)
    if (!formData.password || formData.password.length < 12) {
      return 'Le mot de passe doit contenir au moins 12 caractères';
    }

    // Nom du commerce
    if (!formData.storeName) {
      return 'Le nom du commerce est requis';
    }

    // Adresse
    if (!formData.address) {
      return 'L\'adresse est requise';
    }

    // Code postal
    if (!formData.postalCode) {
      return 'Le code postal est requis';
    }

    // Ville
    if (!formData.city) {
      return 'La ville est requise';
    }

    // Description
    if (!formData.description) {
      return 'La description est requise';
    }

    return null;
  };

  const geocodeAddress = async (): Promise<GeocodeResult> => {
    const payload = {
      address: formData.address.trim(),
      postalCode: formData.postalCode.trim(),
      city: formData.city.trim(),
      country: 'France',
    };

    console.log('📍 [REGISTRATION] Géocodage adresse...', payload);

    const headers = await createAuthHeaders({
      'Content-Type': 'application/json',
    });

    const response = await fetch('/api/geocode', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    let result: any = null;
    try {
      result = await response.json();
    } catch (err) {
      console.error('❌ [REGISTRATION] Réponse geocode JSON invalide:', err);
    }

    if (!response.ok || !result?.success) {
      const message = typeof result?.message === 'string'
        ? result.message
        : 'Adresse introuvable. Vérifiez les informations (numéro, rue, ville) et réessayez.';
      throw new Error(message);
    }

    if (typeof result.latitude !== 'number' || typeof result.longitude !== 'number') {
      throw new Error('Réponse geocode invalide.');
    }

    console.log('✅ [REGISTRATION] Géocodage réussi:', result);

    return {
      latitude: result.latitude,
      longitude: result.longitude,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 [REGISTRATION] Démarrage de l\'inscription...', formData);

      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const geocode = await geocodeAddress();
        latitude = geocode.latitude;
        longitude = geocode.longitude;
      } catch (geoError) {
        console.error('❌ [REGISTRATION] Géocodage impossible:', geoError);
        setError(
          geoError instanceof Error
            ? geoError.message
            : 'Impossible de localiser l\'adresse. Veuillez vérifier vos informations.',
        );
        setLoading(false);
        return;
      }

      // Appel à l'API d'inscription
      const registrationHeaders = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch('/api/merchant/register', {
        method: 'POST',
        headers: registrationHeaders,
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          businessName: formData.storeName,
          merchantType: formData.merchantType,
          taxId: '00000000000000', // SIRET temporaire (comme dans Dart)
          phone: '+33600000000', // Téléphone temporaire (comme dans Dart)
          addressLine1: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          description: formData.description,
          latitude,
          longitude,
          country: 'France',
        }),
      });

      let result: any = null;

      try {
        result = await response.json();
      } catch (err) {
        console.error('❌ [REGISTRATION] Réponse JSON invalide:', err);
      }

      if (!response.ok) {
        const message = typeof result?.message === 'string'
          ? result.message
          : result?.error ?? 'Erreur lors de l\'inscription';
        setError(message);
        return;
      }

      console.log('✅ [REGISTRATION] Inscription réussie!');

      // Rediriger vers la page de connexion pour se connecter manuellement
      // (évite les problèmes AppCheck avec la connexion automatique)
      setSuccess('Inscription réussie ! Redirection vers la page de connexion...');
      setTimeout(() => {
        router.push('/merchant/login?registered=true');
      }, 2000);
    } catch (err) {
      console.error('❌ [REGISTRATION] Erreur:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-lg text-sm">
          ✅ {success}
        </div>
      )}

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
          Email professionnel
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-foreground-muted text-sm">
            📧
          </span>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="contact@moncommerce.fr"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      {/* Mot de passe */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
          Mot de passe
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-foreground-muted text-sm">
            🔒
          </span>
          <input
            type={obscurePassword ? 'password' : 'text'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Minimum 12 caractères"
            className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
          <button
            type="button"
            onClick={() => setObscurePassword(!obscurePassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-foreground-muted hover:text-foreground text-sm"
          >
            {obscurePassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        <p className="mt-0.5 text-xs text-foreground-muted">
          Le mot de passe doit contenir au moins 12 caractères
        </p>
      </div>

      {/* Nom du commerce */}
      <div>
        <label htmlFor="storeName" className="block text-sm font-medium text-foreground mb-1">
          Nom du commerce
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-foreground-muted text-sm">
            🏪
          </span>
          <input
            type="text"
            id="storeName"
            name="storeName"
            value={formData.storeName}
            onChange={handleChange}
            required
            placeholder="Ex: Boulangerie Dupont"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      {/* Type d'activité - Dropdown personnalisé */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Type d&apos;activité
        </label>
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-foreground text-left focus:outline-none focus:ring-2 focus:ring-primary transition-colors flex items-center justify-between"
          >
            <span className="font-semibold">{MerchantTypeLabels[formData.merchantType]}</span>
            <span className={`transition-transform duration-200 text-xs ${isDropdownOpen ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {/* Menu déroulant avec coins arrondis */}
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {Object.values(MerchantType).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, merchantType: type }));
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-sm text-left hover:bg-primary hover:bg-opacity-10 transition-colors first:rounded-t-lg last:rounded-b-lg ${formData.merchantType === type ? 'bg-primary bg-opacity-5 font-semibold' : ''
                    }`}
                >
                  {MerchantTypeLabels[type]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Adresse */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-foreground mb-1">
          Adresse
        </label>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-foreground-muted text-sm">
            🏠
          </span>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="Ex: 123 Rue de la Paix"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      {/* Code postal et Ville */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="postalCode" className="block text-sm font-medium text-foreground mb-1">
            Code postal
          </label>
          <input
            type="text"
            id="postalCode"
            name="postalCode"
            value={formData.postalCode}
            onChange={handleChange}
            required
            placeholder="75001"
            maxLength={5}
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
        <div className="col-span-2">
          <label htmlFor="city" className="block text-sm font-medium text-foreground mb-1">
            Ville
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            placeholder="Paris"
            className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-foreground mb-1">
          Description courte
        </label>
        <div className="relative">
          <span className="absolute top-2 left-2.5 text-foreground-muted text-sm">
            📝
          </span>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={2}
            placeholder="Décrivez brièvement votre activité et votre engagement anti-gaspi..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-colors resize-none"
          />
        </div>
      </div>

      {/* Bouton d'inscription */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-3"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2 text-sm">
            <span className="animate-spin">⏳</span>
            Création du compte en cours...
          </span>
        ) : (
          'Créer mon compte'
        )}
      </button>
    </form>
  );
}

