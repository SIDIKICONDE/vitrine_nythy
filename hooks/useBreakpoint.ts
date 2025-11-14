'use client';

import { useEffect, useState } from 'react';

import { BREAKPOINTS, getBreakpoint } from '@/lib/design-system';
import type { BreakpointKey } from '@/types';

const ORDERED_BREAKPOINTS = Object.entries(BREAKPOINTS).sort(
  ([, valueA], [, valueB]) => valueA - valueB,
) as Array<[BreakpointKey, number]>;

/**
 * Hook utilitaire pour connaître le breakpoint actuel (responsive design)
 */
export function useBreakpoint(initial: BreakpointKey = 'xs'): BreakpointKey {
  const [current, setCurrent] = useState<BreakpointKey>(initial);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleResize = () => {
      setCurrent(getBreakpoint(window.innerWidth));
    };

    // Initial call
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return current;
}

/**
 * Permet de vérifier si l'on a atteint un breakpoint donné
 */
export function useIsBreakpoint(minBreakpoint: BreakpointKey): boolean {
  const current = useBreakpoint();
  const minIndex = ORDERED_BREAKPOINTS.findIndex(([key]) => key === minBreakpoint);
  const currentIndex = ORDERED_BREAKPOINTS.findIndex(([key]) => key === current);

  if (minIndex === -1 || currentIndex === -1) {
    return false;
  }

  return currentIndex >= minIndex;
}

