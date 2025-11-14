/**
 * Content Security Policy avec Nonces Dynamiques
 * 
 * Génération de CSP sécurisé avec:
 * - Nonces uniques par requête
 * - Whitelist stricte
 * - Support Next.js App Router
 * - Reporting des violations
 */

import { NextResponse } from 'next/server';

// ==================== TYPES ====================

export interface CspConfig {
  nonce: string;
  reportUri?: string;
  reportOnly?: boolean;
}

export interface CspDirectives {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'frame-src'?: string[];
  'frame-ancestors'?: string[];
  'object-src'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
}

// ==================== CONFIGURATION ====================

/**
 * Domaines autorisés pour les différentes directives
 */
const ALLOWED_DOMAINS = {
  // APIs externes
  connect: [
    'https://*.googleapis.com',
    'https://*.firebaseio.com',
    'https://*.cloudfunctions.net',
    'wss://*.firebaseio.com',
    'https://api.nythy.app',
    'https://vitals.vercel-insights.com',
    // Google reCAPTCHA Enterprise endpoints
    'https://www.google.com',
    'https://www.gstatic.com',
  ],
  // Images
  img: [
    'https://*.googleusercontent.com',
    'https://firebasestorage.googleapis.com',
    'https://cdn.nythy.app',
    'https://images.unsplash.com',
  ],
  // Fonts
  font: [
    'https://fonts.gstatic.com',
  ],
  // Styles
  style: [
    'https://fonts.googleapis.com',
  ],
  // Scripts
  script: [
    // Google reCAPTCHA Enterprise (nécessaire pour App Check)
    'https://www.google.com',
    'https://www.gstatic.com',
    // Développement uniquement
    ...(process.env['NODE_ENV'] === 'development' ? ['https://vercel.live'] : []),
  ],
  // Frames (iframes pour reCAPTCHA)
  frame: [
    'https://www.google.com',
    'https://recaptcha.google.com',
  ],
};

// ==================== NONCE GENERATION ====================

/**
 * Génère un nonce cryptographiquement sécurisé
 */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64');
}

// ==================== CSP BUILDER ====================

/**
 * Construit la directive CSP complète
 */
export function buildCspHeader(config: CspConfig): string {
  const directives: CspDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${config.nonce}'`,
      "'strict-dynamic'", // Permet aux scripts avec nonce de charger d'autres scripts
      ...ALLOWED_DOMAINS.script,
    ],
    'style-src': [
      "'self'",
      `'nonce-${config.nonce}'`,
      ...ALLOWED_DOMAINS.style,
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      ...ALLOWED_DOMAINS.img,
    ],
    'font-src': [
      "'self'",
      'data:',
      ...ALLOWED_DOMAINS.font,
    ],
    'connect-src': [
      "'self'",
      ...ALLOWED_DOMAINS.connect,
    ],
    'frame-src': [
      "'self'",
      ...ALLOWED_DOMAINS.frame,
    ],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': process.env['NODE_ENV'] === 'production',
    'block-all-mixed-content': process.env['NODE_ENV'] === 'production',
  };

  // Ajouter le report-uri si configuré
  const parts: string[] = [];

  for (const [key, value] of Object.entries(directives)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'boolean') {
      if (value) {
        parts.push(key);
      }
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        parts.push(`${key} ${value.join(' ')}`);
      }
    }
  }

  if (config.reportUri) {
    parts.push(`report-uri ${config.reportUri}`);
  }

  return parts.join('; ');
}

/**
 * Construit un CSP plus permissif pour le développement
 */
export function buildDevCspHeader(config: CspConfig): string {
  const directives: CspDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${config.nonce}'`,
      "'unsafe-eval'", // Nécessaire pour HMR
      'blob:', // Nécessaire pour les extensions du navigateur et HMR
      ...ALLOWED_DOMAINS.script,
    ],
    'style-src': [
      "'self'",
      `'nonce-${config.nonce}'`,
      "'unsafe-inline'", // Nécessaire pour HMR
      ...ALLOWED_DOMAINS.style,
    ],
    'img-src': [
      "'self'",
      'data:',
      'blob:',
      'https:',
    ],
    'font-src': [
      "'self'",
      'data:',
      ...ALLOWED_DOMAINS.font,
    ],
    'connect-src': [
      "'self'",
      'ws:',
      'wss:',
      ...ALLOWED_DOMAINS.connect,
    ],
    'frame-src': [
      "'self'",
      ...ALLOWED_DOMAINS.frame,
    ],
    'frame-ancestors': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
  };

  const parts: string[] = [];

  for (const [key, value] of Object.entries(directives)) {
    if (value === undefined || value === null) continue;

    if (typeof value === 'boolean') {
      if (value) {
        parts.push(key);
      }
    } else if (Array.isArray(value)) {
      if (value.length > 0) {
        parts.push(`${key} ${value.join(' ')}`);
      }
    }
  }

  return parts.join('; ');
}

// ==================== MIDDLEWARE INTEGRATION ====================

/**
 * Ajoute les headers CSP à une réponse
 */
export function applyCspHeaders(
  response: NextResponse,
  nonce: string
): void {
  const isDev = process.env['NODE_ENV'] === 'development';

  const config: CspConfig = {
    nonce,
    reportUri: process.env['CSP_REPORT_URI'],
    reportOnly: isDev,
  };

  const cspHeader = isDev
    ? buildDevCspHeader(config)
    : buildCspHeader(config);

  const headerName = config.reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  response.headers.set(headerName, cspHeader);
}

/**
 * Crée un middleware CSP complet
 */
export function createCspMiddleware() {
  return (response: NextResponse): NextResponse => {
    const nonce = generateNonce();

    // Stocker le nonce dans les headers pour qu'il soit accessible par les composants
    response.headers.set('x-nonce', nonce);

    // Appliquer le CSP
    applyCspHeaders(response, nonce);

    return response;
  };
}

// ==================== REACT/NEXT.JS HELPERS ====================

/**
 * Hook pour récupérer le nonce côté serveur (Server Components)
 */
export function getNonceFromHeaders(headers: Headers): string | null {
  return headers.get('x-nonce');
}

/**
 * Génère les props de script avec nonce pour Next.js
 */
export function getScriptNonceProps(nonce: string): { nonce: string } {
  return { nonce };
}

/**
 * Génère les props de style avec nonce pour Next.js
 */
export function getStyleNonceProps(nonce: string): { nonce: string } {
  return { nonce };
}

// ==================== VIOLATION REPORTING ====================

export interface CspViolation {
  'document-uri': string;
  'violated-directive': string;
  'effective-directive': string;
  'original-policy': string;
  'blocked-uri': string;
  'status-code': number;
  'source-file'?: string;
  'line-number'?: number;
  'column-number'?: number;
}

export interface CspViolationReport {
  'csp-report': CspViolation;
}

/**
 * Parse et valide un rapport de violation CSP
 */
export function parseCspViolationReport(body: any): CspViolation | null {
  if (!body || typeof body !== 'object') {
    return null;
  }

  const report = body['csp-report'];
  if (!report || typeof report !== 'object') {
    return null;
  }

  // Valider les champs requis
  if (
    typeof report['document-uri'] !== 'string' ||
    typeof report['violated-directive'] !== 'string' ||
    typeof report['blocked-uri'] !== 'string'
  ) {
    return null;
  }

  return report as CspViolation;
}

/**
 * Analyse une violation CSP pour déterminer sa gravité
 */
export function analyzeCspViolation(violation: CspViolation): {
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  shouldAlert: boolean;
} {
  const directive = violation['violated-directive'] || violation['effective-directive'];
  const blockedUri = violation['blocked-uri'];

  // Violations critiques
  if (directive.includes('script-src') && !blockedUri.startsWith('data:')) {
    return {
      severity: 'critical',
      reason: 'Unauthorized script execution attempt',
      shouldAlert: true,
    };
  }

  if (directive.includes('frame-ancestors')) {
    return {
      severity: 'critical',
      reason: 'Clickjacking attempt detected',
      shouldAlert: true,
    };
  }

  // Violations élevées
  if (directive.includes('connect-src')) {
    return {
      severity: 'high',
      reason: 'Unauthorized network connection',
      shouldAlert: true,
    };
  }

  // Violations moyennes
  if (directive.includes('style-src') || directive.includes('img-src')) {
    return {
      severity: 'medium',
      reason: 'Unauthorized resource loading',
      shouldAlert: false,
    };
  }

  // Violations basses
  return {
    severity: 'low',
    reason: 'CSP policy violation',
    shouldAlert: false,
  };
}

// ==================== TESTING ====================

/**
 * Génère un CSP de test pour validation
 */
export function generateTestCsp(): string {
  const testNonce = 'TEST-NONCE-123';
  return buildCspHeader({ nonce: testNonce });
}

/**
 * Valide qu'un CSP contient les directives minimales requises
 */
export function validateCsp(csp: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const requiredDirectives = [
    'default-src',
    'script-src',
    'style-src',
    'object-src',
    'frame-ancestors',
  ];

  for (const directive of requiredDirectives) {
    if (!csp.includes(directive)) {
      errors.push(`Missing required directive: ${directive}`);
    }
  }

  // Vérifier qu'il n'y a pas de 'unsafe-inline' ou 'unsafe-eval' en production
  if (process.env['NODE_ENV'] === 'production') {
    if (csp.includes("'unsafe-inline'") && csp.includes('script-src')) {
      errors.push("'unsafe-inline' should not be used in script-src in production");
    }
    if (csp.includes("'unsafe-eval'") && csp.includes('script-src')) {
      errors.push("'unsafe-eval' should not be used in script-src in production");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ==================== EXPORTS ====================

export {
  ALLOWED_DOMAINS
};

