/**
 * Sanitization des données
 * 
 * Nettoie les données pour prévenir les attaques XSS, injection, etc.
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Créer un environnement DOM pour DOMPurify côté serveur
let purify: typeof DOMPurify;

if (typeof window !== 'undefined') {
  // Côté client
  purify = DOMPurify;
} else {
  // Côté serveur
  const window = new JSDOM('').window;
  purify = DOMPurify(window as any);
}

// ==================== SANITIZATION HTML ====================

/**
 * Options de sanitization par défaut
 */
const DEFAULT_SANITIZE_OPTIONS = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'] as string[],
  ALLOWED_ATTR: [] as string[],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
};

/**
 * Sanitize une chaîne HTML
 * 
 * @param html - HTML à nettoyer
 * @param strict - Mode strict (supprime tout le HTML) ou permissif
 * @returns HTML nettoyé
 */
export function sanitizeHtml(html: string, strict: boolean = true): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  if (strict) {
    // Mode strict : supprime tout le HTML, garde seulement le texte
    return purify.sanitize(html, {
      ...DEFAULT_SANITIZE_OPTIONS,
      ALLOWED_TAGS: [],
    });
  }

  // Mode permissif : garde certains tags HTML basiques
  return purify.sanitize(html, DEFAULT_SANITIZE_OPTIONS);
}

/**
 * Sanitize une chaîne de texte (supprime tout HTML)
 */
export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Supprimer tout HTML et échapper les caractères spéciaux
  return purify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
}

// ==================== SANITIZATION SQL/NoSQL ====================

/**
 * Échappe les caractères spéciaux pour prévenir l'injection SQL/NoSQL
 * Note: Firestore utilise des requêtes paramétrées, mais on nettoie quand même
 */
export function sanitizeForDatabase(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Supprimer les caractères dangereux
  return input
    .replace(/['";\\]/g, '') // Supprimer quotes et backslashes
    .replace(/[<>]/g, '') // Supprimer chevrons
    .trim();
}

/**
 * Valide et nettoie un ID de document Firestore
 */
export function sanitizeId(id: string): string | null {
  if (!id || typeof id !== 'string') {
    return null;
  }

  // Firestore IDs: alphanumeric, underscore, hyphen, max 1500 chars
  const cleaned = id.trim().replace(/[^a-zA-Z0-9_-]/g, '');

  if (cleaned.length === 0 || cleaned.length > 1500) {
    return null;
  }

  return cleaned;
}

// ==================== SANITIZATION OBJETS ====================

/**
 * Sanitize un objet récursivement
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  options: {
    html?: boolean;
    text?: boolean;
    deep?: boolean;
  } = {}
): T {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  const sanitized = { ...obj } as any;

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      if (options.html) {
        sanitized[key] = sanitizeHtml(value);
      } else if (options.text) {
        sanitized[key] = sanitizeText(value);
      } else {
        sanitized[key] = sanitizeText(value); // Par défaut, sanitize text
      }
    } else if (options.deep && typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, options);
    }
  }

  return sanitized as T;
}

// ==================== VALIDATION ET SANITIZATION COMBINÉES ====================

/**
 * Nettoie et valide une chaîne pour l'utiliser dans une URL
 */
export function sanitizeForUrl(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, '-') // Remplacer caractères spéciaux par des tirets
    .replace(/-+/g, '-') // Remplacer tirets multiples par un seul
    .replace(/^-|-$/g, ''); // Supprimer tirets en début/fin
}

/**
 * Nettoie un email
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }

  return email
    .toLowerCase()
    .trim()
    .replace(/[<>]/g, '') // Supprimer chevrons
    .replace(/\s+/g, ''); // Supprimer espaces
}

/**
 * Nettoie un numéro de téléphone
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Garder seulement les chiffres et le +
  return phone.replace(/[^0-9+]/g, '');
}

// ==================== DÉTECTION DE PATTERNS MALVEILLANTS ====================

/**
 * Détecte les tentatives d'injection SQL basiques
 */
export function detectSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(['";].*OR.*['";])/i,
    /(['";].*AND.*['";])/i,
    /(['";].*UNION.*['";])/i,
    /(['";].*--)/i,
    /(['";].*\/\*)/i,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Détecte les tentatives XSS basiques
 */
export function detectXss(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const xssPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Valide qu'une chaîne ne contient pas de patterns malveillants
 */
export function isSafeInput(input: string): {
  safe: boolean;
  reason?: string;
} {
  if (detectSqlInjection(input)) {
    return { safe: false, reason: 'SQL injection detected' };
  }

  if (detectXss(input)) {
    return { safe: false, reason: 'XSS detected' };
  }

  return { safe: true };
}

