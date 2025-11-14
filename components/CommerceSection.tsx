import type { ReactElement } from 'react';
import { AnimatedSection } from './AnimatedSection';
import { Container } from './layout/Container';
import { Section } from './layout/Section';

/**
 * Section "Commerces" - Pour les commerçants partenaires
 */
export function CommerceSection(): ReactElement {
  const advantages = [
    {
      title: 'Valoriser vos invendus',
      description: 'Donnez une seconde vie à vos produits au lieu de les jeter'
    },
    {
      title: 'Impact environnemental',
      description: 'Réduisez votre empreinte écologique et participez à la lutte anti-gaspillage'
    },
    {
      title: 'Clientèle engagée',
      description: 'Attirez de nouveaux clients sensibles aux valeurs responsables'
    },
    {
      title: 'Solution digitale simple',
      description: 'Une application intuitive et facile à utiliser au quotidien'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Inscription simple',
      description: 'Créez votre compte commerce en quelques minutes'
    },
    {
      number: '02',
      title: 'Publier vos invendus',
      description: 'Ajoutez vos produits disponibles directement sur l\'app'
    },
    {
      number: '03',
      title: 'Les citoyens réservent',
      description: 'Recevez les réservations en temps réel'
    },
    {
      number: '04',
      title: 'Récupération en boutique',
      description: 'Les clients viennent chercher leurs produits chez vous'
    }
  ];

  const commerceTypes = [
    'Boulangeries',
    'Restaurants',
    'Supermarchés',
    'Primeurs',
    'Traiteurs',
    'Pâtisseries',
    'Épiceries',
    'Boucheries'
  ];

  return (
    <>
      {/* Hero Section */}
      <Section id="commerces" className="bg-linear-to-br from-primary via-primary-dark to-primary py-12 md:py-16">
        <Container>
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              Commerçants, rejoignez le mouvement
            </h1>
            <p className="text-lg md:text-xl text-primary leading-relaxed font-semibold">
              Ensemble, valorisons vos invendus et luttons contre le gaspillage alimentaire
            </p>
          </div>
        </Container>
      </Section>

      {/* Avantages Section */}
      <Section className="bg-white py-10 md:py-12">
        <Container>
          <AnimatedSection animation="fade-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
                Pourquoi rejoindre Nythy ?
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto text-base">
                Devenez acteur du changement tout en bénéficiant d'une solution moderne et efficace
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((advantage, index) => (
              <AnimatedSection
                key={index}
                animation="scale"
                delay={index * 150}
              >
                <div className="bg-surface rounded-2xl p-6 text-center hover:shadow-lg transition-shadow duration-300">
                  <h3 className="text-lg font-bold text-primary mb-2">
                    {advantage.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {advantage.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </Container>
      </Section>

      {/* Comment ça marche */}
      <Section className="bg-surface-muted py-10 md:py-12">
        <Container>
          <AnimatedSection animation="fade-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
                Comment ça marche ?
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto text-base">
                Un processus simple en 4 étapes pour commencer dès aujourd'hui
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <AnimatedSection
                key={index}
                animation="fade-up"
                delay={index * 150}
              >
                <div className="relative bg-white rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                    {step.number}
                  </div>
                  <div className="mt-6">
                    <h3 className="text-lg font-bold text-primary mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {step.description}
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </Container>
      </Section>

      {/* Types de commerces - Slider */}
      <Section className="bg-white py-10 md:py-12">
        <Container>
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
              Tous les commerces de bouche sont les bienvenus
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-base">
              Quelle que soit votre activité, rejoignez notre réseau de commerçants engagés
            </p>
          </div>
        </Container>

        {/* Slider automatique infini - Pleine largeur depuis le bord */}
        <div className="relative overflow-hidden w-full -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="flex animate-scroll-commerce gap-4 pl-4 sm:pl-6 lg:pl-8">
            {/* Première série */}
            {commerceTypes.map((type, index) => (
              <div
                key={`first-${index}`}
                className="px-6 py-3 bg-primary rounded-full text-white font-semibold hover:bg-primary-hover transition-all duration-300 cursor-default whitespace-nowrap shrink-0 text-[40px]"
              >
                {type}
              </div>
            ))}
            {/* Deuxième série (pour continuité) */}
            {commerceTypes.map((type, index) => (
              <div
                key={`second-${index}`}
                className="px-6 py-3 bg-primary rounded-full text-white font-semibold hover:bg-primary-hover transition-all duration-300 cursor-default whitespace-nowrap shrink-0 text-[40px]"
              >
                {type}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA Section */}
      <Section className="bg-primary py-10 md:py-12">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Prêt à faire la différence ?
            </h2>
            <p className="text-white/90 mb-6 text-base">
              Rejoignez dès maintenant les commerces engagés dans la lutte contre le gaspillage
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="#contact"
                className="px-6 py-3 bg-white text-primary font-bold uppercase tracking-wide rounded-lg hover:bg-white/90 transition-colors duration-300 text-sm"
              >
                Devenir partenaire
              </a>
              <a
                href="#nythy-pro"
                className="px-6 py-3 bg-transparent border-2 border-white text-white font-bold uppercase tracking-wide rounded-lg hover:bg-white hover:text-primary transition-all duration-300 text-sm"
              >
                En savoir plus
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

