/**
 * Fonctions utilitaires typées fortement
 */

/**
 * Classe les noms de classes CSS ensemble
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formate une date en français
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'long',
  }).format(dateObj);
}

/**
 * Valide une adresse email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Tronque un texte à une longueur donnée
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return `${text.slice(0, length)}...`;
}

/**
 * Attends un délai spécifié (utile pour les tests et simulations)
 */
export async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Capitalise la première lettre d'une chaîne
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Génère un ID unique
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

