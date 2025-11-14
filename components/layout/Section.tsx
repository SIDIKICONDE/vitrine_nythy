import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Container } from '@/components/layout/Container';
import { SECTION_PADDING, SECTION_VARIANTS } from '@/lib/design-system';
import type { SectionPadding, SectionVariant } from '@/types';

interface SectionProps {
  id?: string;
  title?: string;
  description?: ReactNode;
  children: ReactNode;
  padding?: SectionPadding;
  variant?: SectionVariant;
  align?: 'left' | 'center';
  fullHeight?: boolean;
  className?: string;
  contentClassName?: string;
}

/**
 * Section standardisée avec gestion du variant, des marges et de l'alignement
 */
export function Section({
  id,
  title,
  description,
  children,
  padding = 'lg',
  variant = 'default',
  align = 'left',
  fullHeight = false,
  className,
  contentClassName,
}: SectionProps): ReactNode {
  return (
    <section
      id={id}
      className={cn(
        'relative transition-colors duration-300',
        SECTION_PADDING[padding],
        SECTION_VARIANTS[variant],
        fullHeight && 'min-h-screen flex items-center',
        className,
      )}
    >
      <Container className={cn(fullHeight && 'w-full')} padding="none">
        {(title || description) && (
          <header
            className={cn(
              'mb-12 flex flex-col gap-4',
              align === 'center' ? 'text-center items-center' : 'text-left',
            )}
          >
            {title && (
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="max-w-3xl text-base text-muted sm:text-lg">
                {description}
              </p>
            )}
          </header>
        )}
        <div className={contentClassName}>{children}</div>
      </Container>
    </section>
  );
}

