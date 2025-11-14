/**
 * CSRF Protection for Edge Runtime (Middleware) - Version améliorée
 * 
 * Implémentation robuste du pattern "Double Submit Cookie" avec:
 * - Tokens avec expiration (2h)
 * - Signature HMAC SHA-256
 * - Comparaison timing-safe
 * - Support multi-headers (x-csrf-token, x-xsrf-token)
 * - Régénération forcée après login/logout
 * - Réponses HTTP typées
 * 
 * Compatible Edge Runtime (Web Crypto API)
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Configuration
const CSRF_TOKEN_COOKIE = 'nythy_csrf_token';
const CSRF_SIG_COOKIE = 'nythy_csrf_sig';
const CSRF_HEADER_NAMES = ['x-csrf-token', 'x-xsrf-token'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TOKEN_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 heures

/**
 * Récupère le secret CSRF depuis les variables d'environnement
 */
function getSecret(): string {
  const secret = process.env['CSRF_SECRET'];
  if (!secret) {
    throw new Error('CSRF_SECRET is not defined in environment variables');
  }
  return secret;
}

/**
 * Génère un token CSRF avec timestamp (Edge-compatible)
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  const timestamp = Date.now().toString();
  return `${token}.${timestamp}`;
}

/**
 * Signe un payload avec HMAC SHA-256 (Edge-compatible)
 */
async function signToken(payload: string): Promise<string> {
  const secret = getSecret();
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return Array.from(new Uint8Array(signature), byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Vérifie une signature HMAC (timing-safe)
 */
async function verifySignature(payload: string, signature: string): Promise<boolean> {
  const expectedSignature = await signToken(payload);

  // Comparaison timing-safe manuelle (pas de timingSafeEqual en Edge)
  if (signature.length !== expectedSignature.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }

  return mismatch === 0;
}

/**
 * Parse et valide un token CSRF depuis les cookies
 */
async function parseCsrfCookie(
  tokenCookie?: string,
  sigCookie?: string
): Promise<{ token: string; timestamp: number } | null> {
  if (!tokenCookie || !sigCookie) {
    return null;
  }

  const parts = tokenCookie.split('.');
  if (parts.length !== 2) {
    return null;
  }

  const [token, timestampStr] = parts;
  if (!token || !timestampStr) {
    return null;
  }

  const timestamp = parseInt(timestampStr, 10);

  if (isNaN(timestamp)) {
    return null;
  }

  // Vérifier l'expiration
  const now = Date.now();
  if (now - timestamp > TOKEN_EXPIRY_MS) {
    return null; // Token expiré
  }

  // Vérifier la signature
  const isValid = await verifySignature(tokenCookie, sigCookie);
  if (!isValid) {
    return null;
  }

  return { token, timestamp };
}

/**
 * Extrait le token CSRF de l'en-tête de la requête
 */
export function extractCsrfHeader(request: NextRequest): string | null {
  for (const header of CSRF_HEADER_NAMES) {
    const value = request.headers.get(header);
    if (value) {
      // Extraire seulement le token (sans timestamp)
      const token = value.split('.')[0];
      return token || null;
    }
  }
  return null;
}

/**
 * Assure qu'un cookie CSRF est présent et valide
 * 
 * @param request - La requête Next.js
 * @param response - La réponse Next.js
 * @param force - Force la régénération du token (ex: après login/logout)
 */
export async function ensureCsrfCookie(
  request: NextRequest,
  response: NextResponse,
  force = false
): Promise<void> {
  const existingToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  const existingSig = request.cookies.get(CSRF_SIG_COOKIE)?.value;

  // Si force=false et les cookies existent et sont valides, ne rien faire
  if (!force && existingToken && existingSig) {
    const parsed = await parseCsrfCookie(existingToken, existingSig);
    if (parsed) {
      return; // Token valide, pas besoin de régénérer
    }
  }

  // Générer un nouveau token
  const tokenWithTimestamp = generateCsrfToken();
  const signature = await signToken(tokenWithTimestamp);

  const cookieOptions = {
    httpOnly: false, // Accessible par JS pour être envoyé dans l'en-tête
    sameSite: 'strict' as const,
    secure: process.env['NODE_ENV'] === 'production',
    path: '/',
    maxAge: TOKEN_EXPIRY_MS / 1000, // en secondes
  };

  response.cookies.set({
    name: CSRF_TOKEN_COOKIE,
    value: tokenWithTimestamp,
    ...cookieOptions,
  });

  response.cookies.set({
    name: CSRF_SIG_COOKIE,
    value: signature,
    ...cookieOptions,
    httpOnly: true, // La signature doit être HTTPOnly
  });
}

/**
 * Valide une requête CSRF
 */
export async function validateCsrfRequest(request: NextRequest): Promise<{
  valid: boolean;
  error?: string;
  code?: number;
}> {
  // Les méthodes sûres ne nécessitent pas de validation CSRF
  if (SAFE_METHODS.has(request.method)) {
    return { valid: true };
  }

  const tokenCookie = request.cookies.get(CSRF_TOKEN_COOKIE)?.value;
  const sigCookie = request.cookies.get(CSRF_SIG_COOKIE)?.value;

  const parsedCookie = await parseCsrfCookie(tokenCookie, sigCookie);
  if (!parsedCookie) {
    return {
      valid: false,
      error: 'CSRF cookie missing, invalid, or expired',
      code: 403,
    };
  }

  const headerToken = extractCsrfHeader(request);
  if (!headerToken) {
    return {
      valid: false,
      error: 'CSRF header missing',
      code: 403,
    };
  }

  // Comparaison timing-safe du token
  if (parsedCookie.token.length !== headerToken.length) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
      code: 403,
    };
  }

  let mismatch = 0;
  for (let i = 0; i < parsedCookie.token.length; i++) {
    mismatch |= parsedCookie.token.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }

  if (mismatch !== 0) {
    return {
      valid: false,
      error: 'CSRF token mismatch',
      code: 403,
    };
  }

  return { valid: true };
}

/**
 * Crée une réponse HTTP typée pour une erreur CSRF
 */
export function csrfErrorResponse(error: string, code = 403): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'CSRF validation failed',
      message: error,
    },
    { status: code }
  );
}

// Exports
export {
  SAFE_METHODS as CSRF_SAFE_METHODS, CSRF_SIG_COOKIE, CSRF_TOKEN_COOKIE, TOKEN_EXPIRY_MS as CSRF_TOKEN_EXPIRY_MS
};

