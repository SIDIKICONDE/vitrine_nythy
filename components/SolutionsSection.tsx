import type { ReactElement } from 'react';
import { SolutionsSlider } from './SolutionsSlider';
import { Section } from './layout/Section';
import { Container } from './layout/Container';
import { AnimatedSection } from './AnimatedSection';

/**
 * Section "Nos Solutions" avec slider de solutions
 */
export function SolutionsSection(): ReactElement {
  const solutions = [
    {
      title: 'MARKETPLACE ALIMENTAIRE',
      description: 'Connectez directement vos surplus alimentaires avec des consommateurs locaux. Notre marketplace permet aux commerces de valoriser leurs invendus en temps réel et de créer un impact positif dans leur quartier.',
      tags: ['Commerces locaux', 'Restauration', 'Boulangeries'],
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&h=600&fit=crop',
      imageAlt: 'Marketplace alimentaire NYTHY - Commerce local'
    },
    {
      title: 'GESTION INTELLIGENTE',
      description: 'Optimisez vos stocks et réduisez vos pertes grâce à notre système d\'analyse prédictive. NYTHY vous aide à anticiper vos besoins, ajuster vos commandes et maximiser la valorisation de vos produits.',
      tags: ['Restaurants', 'Supermarchés', 'Traiteurs'],
      image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800&h=600&fit=crop',
      imageAlt: 'Gestion intelligente - Analyse de données'
    },
    {
      title: 'RÉSEAU SOLIDAIRE',
      description: 'Participez à un réseau de redistribution solidaire. Les invendus sont collectés et redistribués aux associations locales, créant un impact social positif tout en réduisant le gaspillage.',
      tags: ['Grandes surfaces', 'Producteurs', 'Associations'],
      image: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&h=600&fit=crop',
      imageAlt: 'Réseau solidaire NYTHY - Aide communautaire'
    }
  ];

  return (
    <Section id="solution" className="bg-primary py-24 md:py-32">
      <Container>
        {/* En-tête de la section */}
        <AnimatedSection animation="fade-down">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 uppercase tracking-wide">
              NOS SOLUTIONS
            </h2>
            <p className="text-white/90 max-w-3xl mx-auto text-lg leading-relaxed">
              Nous offrons un ensemble de solutions permettant à tous les distributeurs alimentaires d'éviter que de la nourriture ne soit gaspillée.
            </p>
          </div>
        </AnimatedSection>

        {/* Slider de solutions */}
        <AnimatedSection animation="fade-up" delay={300}>
          <div className="max-w-4xl mx-auto">
            <SolutionsSlider solutions={solutions} />
          </div>
        </AnimatedSection>
      </Container>
    </Section>
  );
}

