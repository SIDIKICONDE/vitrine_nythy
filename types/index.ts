import type { ReactNode } from 'react';

/**
 * Types globaux de l'application
 */

// Design system
export type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type ContainerWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type SectionPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type SectionVariant = 'default' | 'muted' | 'dark';

export type ResponsiveValue<T> = {
  initial?: T;
} & Partial<Record<BreakpointKey, T>>;

// Types pour les fonctionnalités
export interface Feature {
  id: string;
  icon: string;
  title: string;
  description: string;
}

// Types pour la navigation
export interface NavLink {
  href: string;
  label: string;
  external?: boolean;
}

// Types pour les boutons
export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

// Types pour les sections
export interface SectionSchema {
  id: string;
  title: string;
  content: ReactNode;
}

// Types pour l'API (exemple)
export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Types pour les formulaires
export interface FormField<T = string> {
  name: string;
  label: string;
  value: T;
  error?: string;
  required?: boolean;
}

// Types utilitaires
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncData<T> = {
  data: Nullable<T>;
  loading: boolean;
  error: Nullable<ApiError>;
};

