import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import type { ResponsiveValue } from '@/types';

type GridColumns = 1 | 2 | 3 | 4 | 6;
type GridGap = 'none' | 'sm' | 'md' | 'lg';

type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const COLUMN_CLASS_MAP: Record<GridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
};

const GAP_CLASS_MAP: Record<GridGap, string> = {
  none: 'gap-0',
  sm: 'gap-4',
  md: 'gap-6',
  lg: 'gap-12',
};

const BREAKPOINT_PREFIX: Record<Exclude<BreakpointKey, 'xs'>, string> = {
  sm: 'sm:',
  md: 'md:',
  lg: 'lg:',
  xl: 'xl:',
  '2xl': '2xl:',
};

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: ResponsiveValue<GridColumns>;
  gap?: ResponsiveValue<GridGap> | GridGap;
  className?: string;
}

function buildColumnClasses(columns: ResponsiveValue<GridColumns>): string[] {
  const classes: string[] = [];

  const baseColumn = columns.initial ?? columns.xs ?? 1;
  classes.push(COLUMN_CLASS_MAP[baseColumn]);

  (Object.entries(columns) as Array<[keyof ResponsiveValue<GridColumns>, GridColumns | undefined]>).forEach(
    ([key, value]) => {
      if (!value || key === 'initial' || key === 'xs') {
        return;
      }

      if (key in BREAKPOINT_PREFIX) {
        classes.push(`${BREAKPOINT_PREFIX[key as Exclude<BreakpointKey, 'xs'>]}${COLUMN_CLASS_MAP[value]}`);
      }
    },
  );

  return classes;
}

function buildGapClasses(gap: ResponsiveValue<GridGap> | GridGap): string[] {
  if (typeof gap === 'string') {
    return [GAP_CLASS_MAP[gap]];
  }

  const classes: string[] = [];
  const baseGap = gap.initial ?? gap.xs ?? 'md';
  classes.push(GAP_CLASS_MAP[baseGap]);

  (Object.entries(gap) as Array<[keyof ResponsiveValue<GridGap>, GridGap | undefined]>).forEach(
    ([key, value]) => {
      if (!value || key === 'initial' || key === 'xs') {
        return;
      }

      if (key in BREAKPOINT_PREFIX) {
        classes.push(`${BREAKPOINT_PREFIX[key as Exclude<BreakpointKey, 'xs'>]}${GAP_CLASS_MAP[value]}`);
      }
    },
  );

  return classes;
}

/**
 * Grille responsive configurable via des valeurs déclaratives
 */
export function ResponsiveGrid({
  children,
  columns = { initial: 1, md: 2, xl: 3 },
  gap = { initial: 'sm', md: 'md', xl: 'lg' },
  className,
}: ResponsiveGridProps): ReactNode {
  const columnClasses = buildColumnClasses(columns);
  const gapClasses = buildGapClasses(gap);

  return (
    <div
      className={cn(
        'grid',
        ...columnClasses,
        ...gapClasses,
        className,
      )}
    >
      {children}
    </div>
  );
}

