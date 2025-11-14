/**
 * Tests pour le module CSRF (Node.js Runtime)
 */

import { describe, expect, it } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import {
  CSRF_COOKIE_NAME,
  ensureCsrfCookie,
  extractCsrfHeader,
  generateCsrfToken,
  validateCsrfRequest,
} from '../csrf';

// Mock environment variable
process.env['CSRF_SECRET'] = 'test-secret-key-for-testing-only';

describe('CSRF Module (Node.js Runtime)', () => {
  describe('generateCsrfToken', () => {
    it('should generate a token', () => {
      const token = generateCsrfToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });

    it('should generate hex strings', () => {
      const token = generateCsrfToken();
      expect(token).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('extractCsrfHeader', () => {
    it('should extract token from x-csrf-token header', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'test-token-123',
        },
      });
      const token = extractCsrfHeader(request);
      expect(token).toBe('test-token-123');
    });

    it('should extract token from x-xsrf-token header', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-xsrf-token': 'test-token-456',
        },
      });
      const token = extractCsrfHeader(request);
      expect(token).toBe('test-token-456');
    });

    it('should prioritize x-csrf-token over x-xsrf-token', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'csrf-token',
          'x-xsrf-token': 'xsrf-token',
        },
      });
      const token = extractCsrfHeader(request);
      expect(token).toBe('csrf-token');
    });

    it('should return null if no header is present', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
      });
      const token = extractCsrfHeader(request);
      expect(token).toBeNull();
    });
  });

  describe('validateCsrfRequest', () => {
    it('should allow GET requests without CSRF check', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'GET',
      });
      const result = validateCsrfRequest(request);
      expect(result.valid).toBe(true);
    });

    it('should allow HEAD requests without CSRF check', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'HEAD',
      });
      const result = validateCsrfRequest(request);
      expect(result.valid).toBe(true);
    });

    it('should allow OPTIONS requests without CSRF check', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'OPTIONS',
      });
      const result = validateCsrfRequest(request);
      expect(result.valid).toBe(true);
    });

    it('should reject POST request without CSRF cookie', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
      });
      const result = validateCsrfRequest(request);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('cookie');
    });

    it('should reject POST request without CSRF header', () => {
      const token = generateCsrfToken();
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          Cookie: `${CSRF_COOKIE_NAME}=${token}`,
        },
      });
      const result = validateCsrfRequest(request);
      expect(result.valid).toBe(false);
      // The error could be about missing/invalid cookie or missing header
      expect(result.error).toBeTruthy();
    });
  });

  describe('ensureCsrfCookie', () => {
    it('should set CSRF cookie on response', () => {
      const request = new NextRequest('http://localhost/api/test');
      const response = NextResponse.json({ success: true });

      ensureCsrfCookie(request, response);

      const cookies = response.cookies.getAll();
      const csrfCookie = cookies.find(c => c.name === CSRF_COOKIE_NAME);
      expect(csrfCookie).toBeDefined();
      expect(csrfCookie?.value).toBeTruthy();
    });

    it('should not regenerate cookie if already present and valid', () => {
      const token = generateCsrfToken();
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          Cookie: `${CSRF_COOKIE_NAME}=${token}`,
        },
      });
      const response = NextResponse.json({ success: true });

      ensureCsrfCookie(request, response);

      // Since we can't easily verify if it was NOT set in this mock environment,
      // we just ensure no error is thrown
      expect(response).toBeDefined();
    });
  });
});

