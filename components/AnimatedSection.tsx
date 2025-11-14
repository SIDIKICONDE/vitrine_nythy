'use client';

import { useParallax, useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useEffect, type ReactNode } from 'react';

interface AnimatedSectionProps {
  children: ReactNode;
  animation?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale' | 'rotate';
  delay?: number;
  className?: string;
  threshold?: number;
}

/**
 * Composant wrapper qui applique une animation au scroll
 * Utilise Intersection Observer pour détecter quand l'élément entre dans le viewport
 */
export function AnimatedSection({
  children,
  animation = 'fade-up',
  delay = 0,
  className = '',
  threshold = 0.1,
}: AnimatedSectionProps) {
  const { elementRef, isVisible } = useScrollAnimation({ threshold, triggerOnce: true });

  const animationClass = {
    'fade-up': 'animate-fade-in-up',
    'fade-down': 'animate-fade-in-down',
    'fade-left': 'animate-fade-in-left',
    'fade-right': 'animate-fade-in-right',
    'scale': 'animate-scale-in',
    'rotate': 'animate-rotate-in',
  }[animation];

  const delayClass = delay > 0 ? `animation-delay-${delay}` : '';

  return (
    <div
      ref={elementRef as any}
      className={`${!isVisible ? 'opacity-0' : ''} ${isVisible ? animationClass : ''} ${delayClass} ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Composant pour créer un effet parallax sur un élément
 */
interface ParallaxProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function Parallax({ children, speed = 0.5, className = '' }: ParallaxProps) {
  const { elementRef, offset } = useParallax(speed);

  // Utiliser un effet pour appliquer la transformation via une classe CSS dynamique
  // Note: Le parallax nécessite des valeurs dynamiques, donc on utilise une approche
  // qui évite les styles inline en utilisant des attributs data-* et CSS
  useEffect(() => {
    if (elementRef.current) {
      // Arrondir l'offset pour utiliser des classes prédéfinies
      const roundedOffset = Math.round(offset / 10) * 10; // Arrondir à 10px près
      elementRef.current.setAttribute('data-parallax-offset', roundedOffset.toString());
    }
  }, [offset, elementRef]);

  return (
    <div
      ref={elementRef as any}
      className={`parallax-slow parallax-element ${className}`}
      data-parallax-offset={Math.round(offset / 10) * 10}
    >
      {children}
    </div>
  );
}
