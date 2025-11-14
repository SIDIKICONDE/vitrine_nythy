'use client';

import { useEffect, useRef, useState } from 'react';

interface UseScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook pour déclencher des animations au scroll
 * Utilise Intersection Observer pour détecter quand un élément entre dans le viewport
 */
export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { elementRef, isVisible };
}

/**
 * Hook pour créer un effet parallax basé sur le scroll
 */
export function useParallax(speed: number = 0.5) {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!elementRef.current) return;

      const element = elementRef.current;
      const rect = element.getBoundingClientRect();
      const scrolled = window.scrollY;
      const elementTop = rect.top + scrolled;

      // Calculer l'offset parallax uniquement si l'élément est visible
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        const parallaxOffset = (scrolled - elementTop) * speed;
        setOffset(parallaxOffset);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [speed]);

  return { elementRef, offset };
}

/**
 * Hook pour créer des animations stagger (en cascade)
 */
export function useStaggerAnimation(itemCount: number, delayBetween: number = 100) {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const { elementRef, isVisible } = useScrollAnimation();

  useEffect(() => {
    if (isVisible && visibleItems.length === 0) {
      // Révéler les items progressivement
      for (let i = 0; i < itemCount; i++) {
        setTimeout(() => {
          setVisibleItems(prev => [...prev, i]);
        }, i * delayBetween);
      }
    }
  }, [isVisible, itemCount, delayBetween, visibleItems.length]);

  return { elementRef, visibleItems };
}

