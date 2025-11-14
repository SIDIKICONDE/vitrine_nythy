'use client';

import type { ReactElement } from 'react';
import { useState } from 'react';

/**
 * Formulaire de contact pour les commerces
 */
export function ContactForm(): ReactElement {
  const [formData, setFormData] = useState({
    description: '',
    product: '',
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    phone: '',
    website: '',
    newsletter: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Gérer la soumission du formulaire
    console.log('Form submitted:', formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Qu'est-ce qui vous décrit le mieux */}
      <div>
        <label htmlFor="description" className="block text-primary font-medium mb-1 text-sm">
          Qu'est-ce qui vous décrit le mieux ? *
        </label>
        <select
          id="description"
          name="description"
          required
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm bg-surface text-foreground"
        >
          <option value="">Sélectionnez une option</option>
          <option value="restaurant">Restaurant</option>
          <option value="boulangerie">Boulangerie / Pâtisserie</option>
          <option value="supermarche">Supermarché</option>
          <option value="epicerie">Épicerie</option>
          <option value="traiteur">Traiteur</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      {/* Quel produit vous intéresse */}
      <div>
        <label htmlFor="product" className="block text-primary font-medium mb-1 text-sm">
          Quel produit vous intéresse ? *
        </label>
        <select
          id="product"
          name="product"
          required
          value={formData.product}
          onChange={handleChange}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm bg-surface text-foreground"
        >
          <option value="">Sélectionnez une option</option>
          <option value="marketplace">Marketplace Alimentaire</option>
          <option value="gestion">Gestion Intelligente</option>
          <option value="reseau">Réseau Solidaire</option>
          <option value="global">Solution Globale</option>
        </select>
      </div>

      {/* Prénom */}
      <div>
        <label htmlFor="firstName" className="block text-primary font-medium mb-1 text-sm">
          Prénom *
        </label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          required
          placeholder="Votre prénom"
          value={formData.firstName}
          onChange={handleChange}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm bg-surface text-foreground"
        />
      </div>

      {/* Nom de famille */}
      <div>
        <label htmlFor="lastName" className="block text-primary font-medium mb-1 text-sm">
          Nom de famille *
        </label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          required
          placeholder="Votre nom de famille"
          value={formData.lastName}
          onChange={handleChange}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm bg-surface text-foreground"
        />
      </div>

      {/* E-mail */}
      <div>
        <label htmlFor="email" className="block text-primary font-medium mb-1 text-sm">
          E-mail *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="Votre adresse mail professionnelle"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm bg-surface text-foreground"
        />
      </div>

      {/* Nom d'entreprise */}
      <div>
        <label htmlFor="company" className="block text-primary font-medium mb-1 text-sm">
          Nom d'entreprise *
        </label>
        <input
          type="text"
          id="company"
          name="company"
          required
          placeholder="Le nom de votre entreprise"
          value={formData.company}
          onChange={handleChange}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm bg-surface text-foreground"
        />
      </div>

      {/* Numéro de téléphone */}
      <div>
        <label htmlFor="phone" className="block text-primary font-medium mb-1 text-sm">
          Numéro de téléphone *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          required
          placeholder="+33 6 12 34 56 78"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm bg-surface text-foreground"
        />
      </div>

      {/* Site web */}
      <div>
        <label htmlFor="website" className="block text-primary font-medium mb-1 text-sm">
          Site web
        </label>
        <input
          type="url"
          id="website"
          name="website"
          placeholder="Votre site web"
          value={formData.website}
          onChange={handleChange}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm bg-surface text-foreground"
        />
      </div>

      {/* Newsletter */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          id="newsletter"
          name="newsletter"
          checked={formData.newsletter}
          onChange={handleChange}
          className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
        />
        <label htmlFor="newsletter" className="text-sm text-gray-700">
          J'accepte de recevoir des newsletters et des informations de NYTHY par e-mail et par SMS. Je peux me désinscrire à tout moment.
        </label>
      </div>

      {/* Bouton d'envoi */}
      <button
        type="submit"
        className="w-full md:w-auto px-6 py-3 bg-primary text-white font-bold uppercase tracking-wide rounded-lg hover:bg-primary-dark transition-colors duration-300 flex items-center justify-center gap-2 group text-sm"
      >
        ENVOYER
        <span className="group-hover:translate-x-1 transition-transform">→</span>
      </button>

      <p className="text-sm text-gray-600">
        En vous inscrivant, vous acceptez notre politique de confidentialité.
      </p>
    </form>
  );
}

