/**
 * Design system centralisé : breakpoints, espacements et helpers responsive
 */

import type {
  BreakpointKey,
  ContainerWidth,
  ResponsiveValue,
  SectionPadding,
  SectionVariant,
} from '@/types';

export const BREAKPOINTS: Record<BreakpointKey, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const CONTAINER_MAX_WIDTHS: Record<ContainerWidth, string> = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-none',
};

export const SECTION_PADDING: Record<SectionPadding, string> = {
  none: 'py-0',
  sm: 'py-8 sm:py-10',
  md: 'py-12 sm:py-16',
  lg: 'py-16 sm:py-20',
  xl: 'py-20 sm:py-28',
};

export const SECTION_VARIANTS: Record<SectionVariant, string> = {
  default: 'bg-surface text-foreground',
  muted: 'bg-surface-muted text-foreground',
  dark: 'bg-surface-inverse text-white',
};

const responsivePrefix: Record<Exclude<BreakpointKey, 'xs'>, string> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
  xl: 'xl',
  '2xl': '2xl',
};

/**
 * Construit des classes tailwind responsives à partir d'une valeur déclarative
 */
export function buildResponsiveClasses<T extends string | number>(
  prefix: string,
  values: ResponsiveValue<T>,
): string[] {
  const classes: string[] = [];

  if (values.initial) {
    classes.push(`${prefix}-${values.initial}`);
  }

  (Object.entries(values) as Array<[keyof ResponsiveValue<T>, T]>).forEach(
    ([key, value]) => {
      if (!value || key === 'initial') {
        return;
      }

      if (key in responsivePrefix) {
        classes.push(`${responsivePrefix[key as Exclude<BreakpointKey, 'xs'>]}:${prefix}-${value}`);
      }
    },
  );

  return classes;
}

/**
 * Retourne le breakpoint courant selon une largeur donnée
 */
export function getBreakpoint(width: number): BreakpointKey {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

