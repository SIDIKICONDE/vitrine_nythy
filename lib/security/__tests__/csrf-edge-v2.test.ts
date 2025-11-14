/**
 * Tests pour le module CSRF Edge V2
 */

import { describe, it, expect } from '@jest/globals';
import { NextRequest } from 'next/server';
import {
  generateCsrfToken,
  extractCsrfHeader,
  CSRF_TOKEN_COOKIE,
  CSRF_SIG_COOKIE,
  CSRF_SAFE_METHODS,
} from '../csrf-edge-v2';

// Mock environment variable
process.env['CSRF_SECRET'] = 'test-secret-key-for-csrf-edge-testing';

describe('CSRF Edge V2 Module', () => {
  describe('generateCsrfToken', () => {
    it('should generate a token with timestamp', () => {
      const token = generateCsrfToken();
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token).toContain('.');
    });

    it('should generate unique tokens', () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });

    it('should have token and timestamp parts', () => {
      const token = generateCsrfToken();
      const parts = token.split('.');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toBeTruthy(); // Token part
      expect(parts[1]).toBeTruthy(); // Timestamp part
    });

    it('should have valid timestamp', () => {
      const token = generateCsrfToken();
      const parts = token.split('.');
      const timestampPart = parts[1];
      expect(timestampPart).toBeTruthy();
      const timestamp = parseInt(timestampPart || '0', 10);
      expect(timestamp).toBeGreaterThan(0);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('extractCsrfHeader', () => {
    it('should extract token from x-csrf-token header', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'abc123.1234567890',
        },
      });
      const token = extractCsrfHeader(request);
      expect(token).toBe('abc123');
    });

    it('should extract token from x-xsrf-token header', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-xsrf-token': 'def456.1234567890',
        },
      });
      const token = extractCsrfHeader(request);
      expect(token).toBe('def456');
    });

    it('should return null if no header is present', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
      });
      const token = extractCsrfHeader(request);
      expect(token).toBeNull();
    });

    it('should handle token without timestamp', () => {
      const request = new NextRequest('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': 'abc123',
        },
      });
      const token = extractCsrfHeader(request);
      expect(token).toBe('abc123');
    });
  });

  describe('CSRF_SAFE_METHODS', () => {
    it('should include GET', () => {
      expect(CSRF_SAFE_METHODS.has('GET')).toBe(true);
    });

    it('should include HEAD', () => {
      expect(CSRF_SAFE_METHODS.has('HEAD')).toBe(true);
    });

    it('should include OPTIONS', () => {
      expect(CSRF_SAFE_METHODS.has('OPTIONS')).toBe(true);
    });

    it('should not include POST', () => {
      expect(CSRF_SAFE_METHODS.has('POST')).toBe(false);
    });

    it('should not include PUT', () => {
      expect(CSRF_SAFE_METHODS.has('PUT')).toBe(false);
    });

    it('should not include DELETE', () => {
      expect(CSRF_SAFE_METHODS.has('DELETE')).toBe(false);
    });
  });

  describe('Cookie names', () => {
    it('should have correct token cookie name', () => {
      expect(CSRF_TOKEN_COOKIE).toBe('nythy_csrf_token');
    });

    it('should have correct signature cookie name', () => {
      expect(CSRF_SIG_COOKIE).toBe('nythy_csrf_sig');
    });
  });
});

