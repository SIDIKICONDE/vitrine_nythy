/**
 * Tests pour le module CSP avec Nonces
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateNonce,
  buildCspHeader,
  buildDevCspHeader,
  validateCsp,
  parseCspViolationReport,
  analyzeCspViolation,
  getNonceFromHeaders,
  getScriptNonceProps,
  getStyleNonceProps,
} from '../csp-nonce';

describe('CSP Nonce Module', () => {
  describe('generateNonce', () => {
    it('should generate a nonce', () => {
      const nonce = generateNonce();
      expect(nonce).toBeTruthy();
      expect(typeof nonce).toBe('string');
    });

    it('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();
      expect(nonce1).not.toBe(nonce2);
    });

    it('should generate base64 strings', () => {
      const nonce = generateNonce();
      expect(nonce).toMatch(/^[A-Za-z0-9+/=]+$/);
    });
  });

  describe('buildCspHeader', () => {
    it('should include the nonce in script-src', () => {
      const nonce = 'test-nonce-123';
      const csp = buildCspHeader({ nonce });
      expect(csp).toContain(`'nonce-${nonce}'`);
      expect(csp).toContain('script-src');
    });

    it('should include the nonce in style-src', () => {
      const nonce = 'test-nonce-123';
      const csp = buildCspHeader({ nonce });
      expect(csp).toContain(`'nonce-${nonce}'`);
      expect(csp).toContain('style-src');
    });

    it('should include strict-dynamic', () => {
      const nonce = 'test-nonce-123';
      const csp = buildCspHeader({ nonce });
      expect(csp).toContain("'strict-dynamic'");
    });

    it('should include default-src', () => {
      const nonce = 'test-nonce-123';
      const csp = buildCspHeader({ nonce });
      expect(csp).toContain('default-src');
      expect(csp).toContain("'self'");
    });

    it('should block frames', () => {
      const nonce = 'test-nonce-123';
      const csp = buildCspHeader({ nonce });
      expect(csp).toContain('frame-src');
      expect(csp).toContain("'none'");
      expect(csp).toContain('frame-ancestors');
    });

    it('should block objects', () => {
      const nonce = 'test-nonce-123';
      const csp = buildCspHeader({ nonce });
      expect(csp).toContain('object-src');
      expect(csp).toContain("'none'");
    });

    it('should include report-uri if provided', () => {
      const nonce = 'test-nonce-123';
      const reportUri = 'https://example.com/csp-report';
      const csp = buildCspHeader({ nonce, reportUri });
      expect(csp).toContain('report-uri');
      expect(csp).toContain(reportUri);
    });

    it('should not include report-uri if not provided', () => {
      const nonce = 'test-nonce-123';
      const csp = buildCspHeader({ nonce });
      expect(csp).not.toContain('report-uri');
    });

    it('should include upgrade-insecure-requests in production', () => {
      const originalEnv = process.env['NODE_ENV'];
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      });
      
      const nonce = 'test-nonce-123';
      const csp = buildCspHeader({ nonce });
      expect(csp).toContain('upgrade-insecure-requests');
      
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: originalEnv,
        writable: true,
        configurable: true
      });
    });
  });

  describe('buildDevCspHeader', () => {
    it('should include unsafe-eval for development', () => {
      const nonce = 'test-nonce-123';
      const csp = buildDevCspHeader({ nonce });
      expect(csp).toContain("'unsafe-eval'");
    });

    it('should include unsafe-inline for styles', () => {
      const nonce = 'test-nonce-123';
      const csp = buildDevCspHeader({ nonce });
      expect(csp).toContain("'unsafe-inline'");
      expect(csp).toContain('style-src');
    });

    it('should allow websockets', () => {
      const nonce = 'test-nonce-123';
      const csp = buildDevCspHeader({ nonce });
      expect(csp).toContain('ws:');
      expect(csp).toContain('wss:');
    });

    it('should be more permissive than production CSP', () => {
      const nonce = 'test-nonce-123';
      const prodCsp = buildCspHeader({ nonce });
      const devCsp = buildDevCspHeader({ nonce });
      
      expect(devCsp).toContain("'unsafe-eval'");
      expect(prodCsp).not.toContain("'unsafe-eval'");
    });
  });

  describe('validateCsp', () => {
    it('should validate a complete CSP', () => {
      const nonce = 'test-nonce-123';
      const csp = buildCspHeader({ nonce });
      const result = validateCsp(csp);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing default-src', () => {
      const csp = 'script-src self';
      const result = validateCsp(csp);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('default-src'))).toBe(true);
    });

    it('should detect missing script-src', () => {
      const csp = 'default-src self';
      const result = validateCsp(csp);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('script-src'))).toBe(true);
    });

    it('should detect missing object-src', () => {
      const csp = 'default-src self; script-src self';
      const result = validateCsp(csp);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('object-src'))).toBe(true);
    });
  });

  describe('parseCspViolationReport', () => {
    it('should parse valid violation report', () => {
      const report = {
        'csp-report': {
          'document-uri': 'https://example.com',
          'violated-directive': 'script-src',
          'effective-directive': 'script-src',
          'original-policy': 'default-src self',
          'blocked-uri': 'https://evil.com/script.js',
          'status-code': 200,
        },
      };
      const result = parseCspViolationReport(report);
      expect(result).toBeTruthy();
      expect(result?.['violated-directive']).toBe('script-src');
    });

    it('should return null for invalid report', () => {
      const report = { invalid: 'report' };
      const result = parseCspViolationReport(report);
      expect(result).toBeNull();
    });

    it('should return null for missing required fields', () => {
      const report = {
        'csp-report': {
          'document-uri': 'https://example.com',
          // Missing other required fields
        },
      };
      const result = parseCspViolationReport(report);
      expect(result).toBeNull();
    });
  });

  describe('analyzeCspViolation', () => {
    it('should mark script-src violations as critical', () => {
      const violation = {
        'document-uri': 'https://example.com',
        'violated-directive': 'script-src',
        'effective-directive': 'script-src',
        'original-policy': 'default-src self',
        'blocked-uri': 'https://evil.com/script.js',
        'status-code': 200,
      };
      const analysis = analyzeCspViolation(violation);
      expect(analysis.severity).toBe('critical');
      expect(analysis.shouldAlert).toBe(true);
    });

    it('should mark frame-ancestors violations as critical', () => {
      const violation = {
        'document-uri': 'https://example.com',
        'violated-directive': 'frame-ancestors',
        'effective-directive': 'frame-ancestors',
        'original-policy': 'default-src self',
        'blocked-uri': 'https://evil.com',
        'status-code': 200,
      };
      const analysis = analyzeCspViolation(violation);
      expect(analysis.severity).toBe('critical');
      expect(analysis.shouldAlert).toBe(true);
      expect(analysis.reason).toContain('Clickjacking');
    });

    it('should mark connect-src violations as high', () => {
      const violation = {
        'document-uri': 'https://example.com',
        'violated-directive': 'connect-src',
        'effective-directive': 'connect-src',
        'original-policy': 'default-src self',
        'blocked-uri': 'https://api.evil.com',
        'status-code': 200,
      };
      const analysis = analyzeCspViolation(violation);
      expect(analysis.severity).toBe('high');
      expect(analysis.shouldAlert).toBe(true);
    });

    it('should mark img-src violations as medium', () => {
      const violation = {
        'document-uri': 'https://example.com',
        'violated-directive': 'img-src',
        'effective-directive': 'img-src',
        'original-policy': 'default-src self',
        'blocked-uri': 'https://images.evil.com',
        'status-code': 200,
      };
      const analysis = analyzeCspViolation(violation);
      expect(analysis.severity).toBe('medium');
      expect(analysis.shouldAlert).toBe(false);
    });

    it('should handle data: URIs in script-src', () => {
      const violation = {
        'document-uri': 'https://example.com',
        'violated-directive': 'script-src',
        'effective-directive': 'script-src',
        'original-policy': 'default-src self',
        'blocked-uri': 'data:text/javascript,alert(1)',
        'status-code': 200,
      };
      const analysis = analyzeCspViolation(violation);
      // data: URIs are classified as low severity
      expect(analysis).toBeDefined();
      expect(analysis.severity).toBe('low');
    });
  });

  describe('getNonceFromHeaders', () => {
    it('should extract nonce from headers', () => {
      const headers = new Headers();
      headers.set('x-nonce', 'test-nonce-123');
      const nonce = getNonceFromHeaders(headers);
      expect(nonce).toBe('test-nonce-123');
    });

    it('should return null if no nonce header', () => {
      const headers = new Headers();
      const nonce = getNonceFromHeaders(headers);
      expect(nonce).toBeNull();
    });
  });

  describe('getScriptNonceProps', () => {
    it('should return nonce props for script', () => {
      const nonce = 'test-nonce-123';
      const props = getScriptNonceProps(nonce);
      expect(props).toEqual({ nonce });
    });
  });

  describe('getStyleNonceProps', () => {
    it('should return nonce props for style', () => {
      const nonce = 'test-nonce-123';
      const props = getStyleNonceProps(nonce);
      expect(props).toEqual({ nonce });
    });
  });
});

