import type { ReactNode } from 'react';

interface FormSectionProps {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

/**
 * Section de formulaire avec style moderne
 */
export function FormSection({ title, icon, children }: FormSectionProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-linear-to-br from-surface-elevated to-surface p-8 shadow-lg transition-all hover:shadow-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

