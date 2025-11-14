import type { ButtonProps } from '@/types';
import type { ReactElement } from 'react';

/**
 * Composant Button typé fortement
 * Exemple d'utilisation du typage strict
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
}: ButtonProps): ReactElement {
  const baseStyles = 'font-semibold transition-all rounded-full';
  
  const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90 hover:scale-105 transition-all shadow-lg',
    secondary: 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20',
    ghost: 'text-white hover:bg-white/10',
  };
  
  const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-8 py-4 text-base',
    lg: 'px-10 py-5 text-lg',
  };
  
  const classes = [
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
    className,
  ].join(' ');
  
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
}

