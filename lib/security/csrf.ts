import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

const CSRF_COOKIE_NAME = 'nythy_csrf';
const CSRF_HEADER_NAMES = ['x-csrf-token', 'x-xsrf-token'];
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getSecret(): string {
  const secret = process.env['CSRF_SECRET'];
  if (!secret) {
    throw new Error('CSRF_SECRET is not defined in environment variables');
  }
  return secret;
}

export function generateCsrfToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function signToken(token: string): string {
  const hmac = crypto.createHmac('sha256', getSecret());
  hmac.update(token);
  return hmac.digest('hex');
}

export function ensureCsrfCookie(request: NextRequest, response: NextResponse): void {
  const existingCookie = request.cookies.get(CSRF_COOKIE_NAME);
  if (existingCookie?.value) {
    return;
  }

  const token = generateCsrfToken();
  const signature = signToken(token);
  const cookieValue = `${token}.${signature}`;

  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: cookieValue,
    httpOnly: false,
    sameSite: 'strict',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/',
  });
}

function parseCsrfCookie(value?: string): string | null {
  if (!value) {
    return null;
  }
  const [token, signature] = value.split('.');
  if (!token || !signature) {
    return null;
  }

  const expectedSignature = signToken(token);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  return token;
}

export function extractCsrfHeader(request: NextRequest): string | null {
  for (const header of CSRF_HEADER_NAMES) {
    const value = request.headers.get(header);
    if (value) {
      return value;
    }
  }
  return null;
}

export function validateCsrfRequest(request: NextRequest): {
  valid: boolean;
  error?: string;
} {
  if (SAFE_METHODS.has(request.method)) {
    return { valid: true };
  }

  const cookieToken = parseCsrfCookie(request.cookies.get(CSRF_COOKIE_NAME)?.value);
  if (!cookieToken) {
    return { valid: false, error: 'CSRF cookie missing or invalid' };
  }

  const headerToken = extractCsrfHeader(request);
  if (!headerToken) {
    return { valid: false, error: 'CSRF header missing' };
  }

  if (!crypto.timingSafeEqual(Buffer.from(cookieToken), Buffer.from(headerToken))) {
    return { valid: false, error: 'CSRF token mismatch' };
  }

  return { valid: true };
}

export { CSRF_COOKIE_NAME, SAFE_METHODS as CSRF_SAFE_METHODS };

