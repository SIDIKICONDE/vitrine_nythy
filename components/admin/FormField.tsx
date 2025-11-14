import type { ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
  hint?: string;
}

/**
 * Champ de formulaire avec label et style cohérent
 */
export function FormField({ label, required, optional, children, hint }: FormFieldProps) {
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <span>{label}</span>
        {required && <span className="text-error">*</span>}
        {optional && <span className="text-xs text-foreground-muted">(optionnel)</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {hint}
        </p>
      )}
    </div>
  );
}

