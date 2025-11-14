'use client';

import type { ReactElement } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Container } from './layout/Container';
import { Section } from './layout/Section';

interface Stat {
  value: number;
  label: string;
  suffix: string;
  icon: string;
  color: string;
  description: string;
}

interface ImpactStats {
  mealsSaved: number;
  co2Saved: number;
  partnersCount: number;
  activeUsers: number;
}

/**
 * Section Impact avec statistiques animées
 * Les compteurs s'animent au scroll avec un effet de comptage
 * Les données sont récupérées depuis le backend
 */
export function ImpactSection(): ReactElement {
  const [isVisible, setIsVisible] = useState(false);
  const [impactData, setImpactData] = useState<ImpactStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Récupérer les statistiques depuis l'API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats/impact');
        if (response.ok) {
          const data = await response.json();
          // Utiliser les données de l'API seulement si elles ne sont pas toutes à 0
          if (data.mealsSaved > 0 || data.partnersCount > 0 || data.activeUsers > 0) {
            setImpactData(data);
          } else {
            // Utiliser des données de démonstration pour le site vitrine
            setImpactData({
              mealsSaved: 1247,
              co2Saved: 3.12,
              partnersCount: 42,
              activeUsers: 856
            });
          }
        } else {
          // En cas d'erreur API, utiliser des données de démonstration
          setImpactData({
            mealsSaved: 1247,
            co2Saved: 3.12,
            partnersCount: 42,
            activeUsers: 856
          });
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des stats d\'impact:', error);
        // En cas d'erreur, utiliser des données de démonstration
        setImpactData({
          mealsSaved: 1247,
          co2Saved: 3.12,
          partnersCount: 42,
          activeUsers: 856
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const stats: Stat[] = [
    {
      value: impactData?.mealsSaved ?? 0,
      label: 'Repas sauvés',
      suffix: '',
      icon: '🍽️',
      color: 'from-green-400 to-green-600',
      description: 'Repas qui auraient été gaspillés'
    },
    {
      value: impactData?.co2Saved ?? 0,
      label: 'Tonnes de CO₂',
      suffix: 't',
      icon: '🌍',
      color: 'from-blue-400 to-blue-600',
      description: 'Émissions évitées grâce à vous'
    },
    {
      value: impactData?.partnersCount ?? 0,
      label: 'Commerces',
      suffix: '',
      icon: '🏪',
      color: 'from-purple-400 to-purple-600',
      description: 'Partenaires engagés avec nous'
    },
    {
      value: impactData?.activeUsers ?? 0,
      label: 'Utilisateurs',
      suffix: '+',
      icon: '👥',
      color: 'from-orange-400 to-orange-600',
      description: 'Acteurs du changement'
    }
  ];

  // Observer pour détecter quand la section entre dans le viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const currentRef = sectionRef.current;

    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div ref={sectionRef}>
      <Section
        id="impact"
        className="relative bg-linear-to-br from-amber-900 via-stone-800 to-amber-950 py-16 md:py-20 overflow-hidden"
      >
        {/* Patterns décoratifs en arrière-plan */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <Container className="relative z-10">
          {/* En-tête */}
          <div className="text-center mb-12 md:mb-16">
            <span className="inline-block text-sm font-bold text-white/80 uppercase tracking-wider mb-3">
              Notre Impact
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              Ensemble, nous faisons la différence
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto">
              Chaque action compte. Découvrez l'impact positif de notre communauté sur l'environnement et la société.
            </p>
          </div>

          {/* Grille de statistiques */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {isLoading ? (
              // Skeleton loading
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20 animate-pulse"
                >
                  <div className="h-16 bg-white/20 rounded mb-4"></div>
                  <div className="h-6 bg-white/20 rounded mb-2"></div>
                  <div className="h-4 bg-white/20 rounded"></div>
                </div>
              ))
            ) : (
              stats.map((stat, index) => (
                <StatCard
                  key={index}
                  stat={stat}
                  isVisible={isVisible}
                  delay={index * 150}
                />
              ))
            )}
          </div>

          {/* Message motivationnel */}
          <div className="mt-12 md:mt-16 text-center">
            <div className="inline-block bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/20">
              <p className="text-white text-lg md:text-xl font-medium">
                🌱 <span className="font-bold">Et ce n'est que le début !</span> Rejoignez-nous pour amplifier cet impact.
              </p>
            </div>
          </div>
        </Container>
      </Section>
    </div>
  );
}

/**
 * Composant StatCard avec animation de compteur
 */
interface StatCardProps {
  stat: Stat;
  isVisible: boolean;
  delay: number;
}

function StatCard({ stat, isVisible, delay }: StatCardProps): ReactElement {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!isVisible || hasAnimated || stat.value === 0) {
      return;
    }

    setHasAnimated(true);

    // Animation du compteur
    const duration = 2000; // 2 secondes
    const steps = 60;
    const increment = stat.value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= stat.value) {
        setCount(stat.value);
        clearInterval(timer);
      } else {
        const precision = stat.value < 10 ? 2 : 0;
        const factor = 10 ** precision;
        setCount(Math.round(current * factor) / factor);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isVisible, hasAnimated, stat.value]);

  // Afficher la valeur animée si disponible, sinon la valeur réelle
  const displayValue = (hasAnimated && count > 0) ? count : stat.value;

  // Mapper le délai à une classe CSS prédéfinie pour éviter les styles inline
  const getDelayClass = (delayMs: number) => {
    if (delayMs <= 0) return 'animation-delay-0';
    if (delayMs <= 100) return 'animation-delay-100';
    if (delayMs <= 150) return 'animation-delay-150';
    if (delayMs <= 200) return 'animation-delay-200';
    if (delayMs <= 300) return 'animation-delay-300';
    if (delayMs <= 400) return 'animation-delay-400';
    if (delayMs <= 500) return 'animation-delay-500';
    if (delayMs <= 600) return 'animation-delay-600';
    return 'animation-delay-700';
  };

  return (
    <div
      className={`group relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${isVisible ? 'animate-fade-in-up' : ''} ${isVisible ? getDelayClass(delay) : ''}`}
    >
      {/* Compteur */}
      <div className="mb-4">
        <div className="relative inline-block">
          <div className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
            {displayValue.toLocaleString('fr-FR')}{stat.suffix}
          </div>
          <div
            aria-hidden="true"
            className={`absolute inset-0 text-5xl md:text-6xl font-bold bg-linear-to-r ${stat.color} bg-clip-text text-transparent pointer-events-none select-none`}
          >
            {displayValue.toLocaleString('fr-FR')}{stat.suffix}
          </div>
        </div>
      </div>

      {/* Label */}
      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
        {stat.label}
      </h3>

      {/* Description */}
      <p className="text-sm text-white/70">
        {stat.description}
      </p>

      {/* Effet de brillance au survol */}
      <div className="absolute inset-0 rounded-2xl bg-linear-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
}

