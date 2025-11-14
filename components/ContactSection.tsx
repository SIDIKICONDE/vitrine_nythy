import type { ReactElement } from 'react';
import { ContactForm } from './ContactForm';
import { Section } from './layout/Section';
import { Container } from './layout/Container';
import { AnimatedSection } from './AnimatedSection';
import Image from 'next/image';

/**
 * Section de contact avec formulaire
 */
export function ContactSection(): ReactElement {
  return (
    <Section id="contact" className="bg-surface py-16 md:py-20">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Colonne gauche - Formulaire */}
          <AnimatedSection animation="fade-right" delay={200}>
            <div>
              {/* En-tête */}
              <div className="mb-6">
                <p className="text-red-500 font-bold uppercase tracking-wide mb-2">
                  DE NOUVEAUX REVENUS POUR LES COMMERCES ALIMENTAIRES
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
                  FORMULAIRE DE DEMANDE COMMERCIALE
                </h2>
              </div>

              {/* Formulaire */}
              <ContactForm />
            </div>
          </AnimatedSection>

          {/* Colonne droite - Image */}
          <AnimatedSection animation="fade-left" delay={400}>
            <div className="relative h-[400px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=1000&fit=crop"
                alt="Employée de commerce avec terminal de paiement"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            </div>
          </AnimatedSection>
        </div>
      </Container>
    </Section>
  );
}

