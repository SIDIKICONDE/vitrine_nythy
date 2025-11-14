/**
 * Page Centre d'aide - Support marchands
 * 
 * ✅ FONCTIONNALITÉS
 * - FAQ par catégories
 * - Recherche d'articles
 * - Guides rapides
 * - Contact support
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import { useState } from 'react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface HelpCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  articles: number;
}

export default function HelpPage() {
  const testUser = {
    name: 'Marchand Test',
    email: 'test@marchand.nythy.com',
    image: null,
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  // Catégories d'aide
  const categories: HelpCategory[] = [
    {
      id: 'getting-started',
      name: 'Démarrage',
      icon: '🚀',
      description: 'Premiers pas sur la plateforme',
      articles: 8,
    },
    {
      id: 'products',
      name: 'Produits',
      icon: '📦',
      description: 'Gérer vos produits anti-gaspi',
      articles: 12,
    },
    {
      id: 'orders',
      name: 'Commandes',
      icon: '🛒',
      description: 'Traiter et gérer les commandes',
      articles: 10,
    },
    {
      id: 'payments',
      name: 'Paiements',
      icon: '💰',
      description: 'Versements et facturation',
      articles: 7,
    },
    {
      id: 'marketing',
      name: 'Marketing',
      icon: '📢',
      description: 'Promouvoir votre commerce',
      articles: 6,
    },
    {
      id: 'technical',
      name: 'Technique',
      icon: '⚙️',
      description: 'Problèmes techniques',
      articles: 9,
    },
  ];

  // Questions fréquentes
  const faqs: FAQItem[] = [
    {
      id: '1',
      question: 'Comment ajouter mon premier produit anti-gaspillage ?',
      answer: 'Pour ajouter un produit : 1) Cliquez sur "Produits" dans le menu, 2) Cliquez sur "Nouveau produit", 3) Remplissez les informations (nom, prix, description), 4) Ajoutez des photos de qualité, 5) Définissez la date de péremption, 6) Cliquez sur "Publier". Votre produit sera visible immédiatement !',
      category: 'products',
    },
    {
      id: '2',
      question: 'Quand et comment reçois-je mes paiements ?',
      answer: 'Les paiements sont versés selon la fréquence que vous avez choisie (hebdomadaire, bi-hebdomadaire ou manuel). Vous recevez les fonds directement sur votre compte bancaire (IBAN). Le délai de traitement est généralement de 2-3 jours ouvrés. Vous pouvez suivre vos versements dans la section "Finances".',
      category: 'payments',
    },
    {
      id: '3',
      question: 'Comment gérer les commandes en attente ?',
      answer: 'Les commandes apparaissent dans la section "Commandes" avec un badge de notification. Vous devez : 1) Confirmer la commande, 2) Préparer les produits, 3) Marquer comme "Prêt pour récupération" ou "En livraison", 4) Finaliser quand le client a reçu. Les clients reçoivent des notifications à chaque étape.',
      category: 'orders',
    },
    {
      id: '6',
      question: 'Comment augmenter ma visibilité sur la plateforme ?',
      answer: 'Plusieurs moyens : 1) Publiez régulièrement de nouveaux produits, 2) Maintenez des prix attractifs, 3) Répondez rapidement aux commandes, 4) Obtenez de bons avis clients, 5) Activez les notifications pour ne rien manquer, 6) Complétez votre profil à 100% avec photos et description.',
      category: 'marketing',
    },
    {
      id: '7',
      question: 'Que faire si je rencontre un problème technique ?',
      answer: 'Essayez d\'abord de vider le cache et recharger la page. Si le problème persiste : 1) Contactez-nous via le formulaire ci-dessous, 2) Décrivez précisément le problème, 3) Ajoutez des captures d\'écran si possible. Notre équipe vous répondra sous 24h.',
      category: 'technical',
    },
    {
      id: '8',
      question: 'Comment fonctionne le système anti-gaspillage ?',
      answer: 'Vous proposez des produits proches de leur date de péremption à prix réduit (-30% à -70%). Les clients peuvent réserver et récupérer en magasin ou se faire livrer. Vous réduisez le gaspillage tout en générant du chiffre d\'affaires sur des produits qui auraient été jetés.',
      category: 'getting-started',
    },
    {
      id: '9',
      question: 'Comment configurer la livraison ?',
      answer: 'Dans Paramètres > Général > Options de livraison : 1) Activez "Livraison locale", 2) Définissez votre rayon de livraison (en km), 3) Fixez les frais de livraison, 4) Définissez un montant minimum de commande. Les clients verront automatiquement si la livraison est disponible.',
      category: 'orders',
    },
    {
      id: '10',
      question: 'Puis-je proposer des paniers surprise ?',
      answer: 'Oui ! C\'est une excellente façon de vendre plusieurs produits d\'un coup. Créez un produit nommé "Panier surprise" avec un assortiment de produits à sauver. Les clients adorent la surprise et c\'est très populaire sur notre plateforme.',
      category: 'products',
    },
  ];

  // Guides rapides
  const quickGuides = [
    {
      title: 'Guide de démarrage rapide',
      description: '10 minutes pour être opérationnel',
      icon: '⚡',
      link: '#',
    },
    {
      title: 'Optimiser vos ventes',
      description: 'Meilleures pratiques et astuces',
      icon: '📈',
      link: '#',
    },
    {
      title: 'Gérer les avis clients',
      description: 'Construire votre réputation',
      icon: '⭐',
      link: '#',
    },
  ];

  // Filtrage des FAQ
  const filteredFAQs = faqs.filter(faq => {
    const matchCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchSearch = searchQuery === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-surface">
      <MerchantHeader user={testUser} />
      <div className="flex">
        <MerchantSidebar />
        <main className="flex-1 p-8 lg:pb-8 pb-24">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-foreground mb-2">
                ❓ Centre d'aide
              </h1>
              <p className="text-foreground-muted text-lg">
                Trouvez rapidement des réponses à vos questions
              </p>
            </div>

            {/* Recherche */}
            <div className="liquid-glass p-6">
              <div className="max-w-2xl mx-auto">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher dans l'aide... (ex: comment ajouter un produit)"
                    className="w-full px-6 py-4 pl-14 rounded-xl border-2 border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-lg"
                  />
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl">
                    🔍
                  </span>
                </div>
              </div>
            </div>

            {/* Catégories */}
            <div className="liquid-glass p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Parcourir par catégorie
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${selectedCategory === category.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-surface-hover hover:border-primary/50'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{category.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground mb-1">
                          {category.name}
                        </h3>
                        <p className="text-sm text-foreground-muted mb-2">
                          {category.description}
                        </p>
                        <span className="text-xs text-primary font-medium">
                          {category.articles} articles
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {selectedCategory !== 'all' && (
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="mt-4 text-primary hover:text-primary-dark font-medium text-sm"
                >
                  ← Voir toutes les catégories
                </button>
              )}
            </div>

            {/* Guides rapides */}
            <div className="liquid-glass p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                📚 Guides rapides
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {quickGuides.map((guide, index) => (
                  <a
                    key={index}
                    href={guide.link}
                    className="p-4 bg-surface-hover hover:bg-surface-active rounded-lg border border-border transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{guide.icon}</span>
                      <div>
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors mb-1">
                          {guide.title}
                        </h3>
                        <p className="text-sm text-foreground-muted">
                          {guide.description}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* FAQ */}
            <div className="liquid-glass p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                💬 Questions fréquentes
              </h2>
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-foreground-muted mb-4">
                    Aucun résultat pour "{searchQuery}"
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-primary hover:text-primary-dark font-medium"
                  >
                    Effacer la recherche
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFAQs.map((faq) => (
                    <div
                      key={faq.id}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                        className="w-full p-4 bg-surface-hover hover:bg-surface-active transition-colors text-left flex items-center justify-between gap-4"
                      >
                        <span className="font-medium text-foreground">
                          {faq.question}
                        </span>
                        <span className="text-2xl shrink-0">
                          {expandedFAQ === faq.id ? '−' : '+'}
                        </span>
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="p-4 bg-surface border-t border-border">
                          <p className="text-foreground-muted leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Contact support */}
            <div className="liquid-glass p-6">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-xl font-bold text-foreground mb-4 text-center">
                  📧 Besoin d'aide supplémentaire ?
                </h2>
                <p className="text-center text-foreground-muted mb-6">
                  Notre équipe support est là pour vous aider. Nous répondons généralement sous 24h.
                </p>

                <div className="space-y-4">
                  {/* Catégorie */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Catégorie
                    </label>
                    <select className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                      <option>Problème technique</option>
                      <option>Question sur les paiements</option>
                      <option>Question sur les produits</option>
                      <option>Question sur les commandes</option>
                      <option>Autre</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Votre message
                    </label>
                    <textarea
                      rows={6}
                      placeholder="Décrivez votre problème ou votre question en détail..."
                      className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Bouton */}
                  <button className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-lg transition-colors">
                    📨 Envoyer le message
                  </button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

