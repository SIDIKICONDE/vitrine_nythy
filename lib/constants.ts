/**
 * Constantes de l'application avec typage fort
 */

import type { NavLink, Feature } from '@/types';

export const APP_NAME = 'Vitrine' as const;
export const APP_VERSION = '0.1.0' as const;

export const NAV_LINKS: readonly NavLink[] = [
  { href: '#features', label: 'Fonctionnalités' },
  { href: '#about', label: 'À propos' },
  { href: '#contact', label: 'Contact' },
] as const;

export const FEATURES: readonly Feature[] = [
  {
    id: 'speed',
    icon: '⚡',
    title: 'Ultra Rapide',
    description: 'Optimisé pour la performance avec Next.js et les dernières technologies web.',
  },
  {
    id: 'design',
    icon: '🎨',
    title: 'Design Moderne',
    description: 'Interface élégante et responsive avec Tailwind CSS v4.',
  },
  {
    id: 'customizable',
    icon: '🔧',
    title: 'Personnalisable',
    description: 'Code TypeScript propre et facile à modifier selon vos besoins.',
  },
] as const;

export const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000/api';

// Types dérivés des constantes
export type AppName = typeof APP_NAME;
export type FeatureId = typeof FEATURES[number]['id'];

