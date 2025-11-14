import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { CONTAINER_MAX_WIDTHS, SECTION_PADDING } from '@/lib/design-system';
import type { ContainerWidth, SectionPadding } from '@/types';

type DefaultElement = 'div';

type PolymorphicProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  maxWidth?: ContainerWidth;
  padding?: SectionPadding;
  fullHeight?: boolean;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'>;

/**
 * Conteneur responsive qui centralise la gestion des largeurs max et espacements verticaux
 */
export function Container<T extends ElementType = DefaultElement>({
  as,
  children,
  className,
  maxWidth = 'xl',
  padding = 'md',
  fullHeight = false,
  ...rest
}: PolymorphicProps<T>): ReactNode {
  const Component = (as ?? 'div') as ElementType;

  return (
    <Component
      className={cn(
        'w-full mx-auto px-4 sm:px-6 lg:px-8',
        CONTAINER_MAX_WIDTHS[maxWidth],
        SECTION_PADDING[padding],
        fullHeight && 'min-h-screen',
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

