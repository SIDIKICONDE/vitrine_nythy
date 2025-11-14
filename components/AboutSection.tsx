import Image from 'next/image';
import type { ReactElement } from 'react';
import { AnimatedSection } from './AnimatedSection';
import { Container } from './layout/Container';
import { Section } from './layout/Section';

/**
 * Section "Qui sommes-nous" - Design minimaliste et créatif
 */
export function AboutSection(): ReactElement {
  const values = [
    {
      title: 'Transmission',
      description: 'Des conseils, du partage de connaissances et de bonnes pratiques pour agir ensemble'
    },
    {
      title: 'Communauté',
      description: 'Une communauté soudée par l\'envie d\'agir ensemble pour une consommation plus responsable'
    },
    {
      title: 'Humain',
      description: 'Une solution humaine et technologique qui place les personnes au cœur de la mission'
    }
  ];

  return (
    <>
      {/* Hero Section - Qui sommes-nous */}
      <Section id="qui-sommes-nous" className="bg-linear-to-br from-primary via-primary-dark to-primary py-12 md:py-16">
        <Container>
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">
              Qui sommes-nous ?
            </h1>
            <p className="text-lg md:text-xl text-primary leading-relaxed font-semibold">
              Une solution humaine et technologique qui unit commerçants et citoyens autour d'un même objectif :
              préserver la valeur de chaque repas et réduire le gaspillage, ensemble.
            </p>
          </div>
        </Container>
      </Section>

      {/* Mission Section */}
      <Section className="bg-white py-10 md:py-12">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Texte */}
            <AnimatedSection animation="fade-right" delay={200}>
              <div>
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Notre Histoire</span>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mt-3 mb-4">
                  Une conviction, une mission
                </h2>
                <div className="space-y-3 text-gray-600 leading-relaxed text-base">
                  <p>
                    <span className="font-semibold text-primary">Nythy</span> a été fondée en <span className="font-semibold">2025</span> par <span className="font-semibold text-primary">Sidiki Condé</span>, animé par une conviction simple :
                    rassembler une communauté engagée autour d'une cause qui lui tient profondément à cœur — la lutte contre le gaspillage alimentaire.
                  </p>
                  <p>
                    Depuis toujours, Sidiki s'est investi pour aider celles et ceux qui en avaient besoin. C'est en constatant la quantité de nourriture encore parfaitement consommable jetée chaque jour qu'il a décidé d'agir concrètement.
                  </p>
                  <p>
                    C'est à <span className="font-semibold text-primary">Strasbourg</span>, ville d'accueil et d'inspiration, que l'idée de Nythy a pris forme : comment offrir une seconde vie aux invendus alimentaires des commerces de bouche, tout en soutenant à la fois les citoyens et les commerçants locaux ?
                  </p>
                </div>
              </div>
            </AnimatedSection>

            {/* Image */}
            <AnimatedSection animation="fade-left" delay={400}>
              <div className="relative h-[300px] lg:h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop"
                  alt="Sidiki Condé, fondateur de NYTHY"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary/20 to-transparent" />
              </div>
            </AnimatedSection>
          </div>
        </Container>
      </Section>

      {/* Values Section - Créatif */}
      <Section className="bg-white py-10 md:py-12">
        <Container>
          <AnimatedSection animation="fade-up">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-primary mb-3">
                Notre Philosophie
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto text-base">
                Nythy ne repose pas seulement sur la transaction, mais sur la transmission :
                des conseils, du partage, et une communauté soudée par l'envie d'agir ensemble pour une consommation plus responsable.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <AnimatedSection
                key={index}
                animation="scale"
                delay={100 + (index * 200)}
              >
                <div className="group relative bg-surface hover:bg-primary transition-all duration-300 rounded-2xl p-6 text-center cursor-pointer">
                  <h3 className="text-xl font-bold text-primary group-hover:text-white mb-3 transition-colors duration-300">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 group-hover:text-white/90 transition-colors duration-300">
                    {value.description}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </Container>
      </Section>

      {/* Vision Section - Asymétrique et créatif */}
      <Section className="bg-primary py-10 md:py-12">
        <Container>
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
              <div className="lg:col-span-2">
                <div className="relative h-[250px] lg:h-[350px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop"
                    alt="Vision NYTHY - Strasbourg"
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="lg:col-span-3 text-white">
                <span className="text-sm font-bold text-white/80 uppercase tracking-wider">Notre Approche</span>
                <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-4 text-white">
                  Offrir une seconde vie
                </h2>
                <p className="text-white/90 text-base leading-relaxed mb-4">
                  De cette réflexion est née Nythy, une solution humaine et technologique qui unit commerçants
                  et citoyens autour d'un même objectif : préserver la valeur de chaque repas et réduire le
                  gaspillage, ensemble.
                </p>
                <p className="text-white/80 leading-relaxed">
                  Notre mission est d'offrir une seconde vie aux invendus alimentaires des commerces de bouche,
                  tout en soutenant à la fois les citoyens et les commerçants locaux, dans un esprit de partage
                  et de solidarité.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA Section - Minimaliste */}
      <Section className="bg-surface-muted py-10 md:py-12">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
              Rejoignez le mouvement
            </h2>
            <p className="text-gray-600 mb-6 text-base">
              Ensemble, faisons la différence. Chaque action compte.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="#contact"
                className="px-6 py-3 bg-primary text-white font-bold uppercase tracking-wide rounded-lg hover:bg-primary-dark transition-colors duration-300 text-sm"
              >
                Devenir partenaire
              </a>
              <a
                href="#app"
                className="px-6 py-3 bg-white border-2 border-primary text-primary font-bold uppercase tracking-wide rounded-lg hover:bg-primary hover:text-white transition-all duration-300 text-sm"
              >
                Télécharger l'app
              </a>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

