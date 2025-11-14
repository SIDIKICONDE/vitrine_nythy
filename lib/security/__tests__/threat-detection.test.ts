/**
 * Tests pour le module de détection de menaces
 */

import { describe, it, expect, jest } from '@jest/globals';
import {
  scanObjectForThreats,
  ThreatFinding,
} from '../threat-detection';

describe('Threat Detection Module', () => {
  describe('scanObjectForThreats', () => {
    it('should detect SQL injection in strings', () => {
      const input = "SELECT * FROM users WHERE id = '1' OR '1'='1'";
      const findings = scanObjectForThreats(input);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].type).toBe('sql_injection');
    });

    it('should detect XSS in strings', () => {
      const input = '<script>alert("XSS")</script>';
      const findings = scanObjectForThreats(input);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].type).toBe('xss');
    });

    it('should scan nested objects', () => {
      const input = {
        name: 'John',
        profile: {
          bio: '<script>alert(1)</script>',
        },
      };
      const findings = scanObjectForThreats(input);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].path).toContain('bio');
      expect(findings[0].type).toBe('xss');
    });

    it('should scan arrays', () => {
      const input = {
        tags: ['normal', '<script>alert(1)</script>', 'safe'],
      };
      const findings = scanObjectForThreats(input);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].path).toContain('[1]');
    });

    it('should scan deeply nested structures', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              malicious: "' OR '1'='1",
            },
          },
        },
      };
      const findings = scanObjectForThreats(input);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].path).toContain('level3.malicious');
    });

    it('should not flag safe content', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        description: 'A normal description',
      };
      const findings = scanObjectForThreats(input);
      expect(findings).toHaveLength(0);
    });

    it('should handle mixed content', () => {
      const input = {
        safe: 'This is safe',
        dangerous: '<script>alert(1)</script>',
        alsoSafe: 'Normal text',
      };
      const findings = scanObjectForThreats(input);
      expect(findings.length).toBe(1);
      expect(findings[0].path).toContain('dangerous');
    });

    it('should limit depth to prevent DoS', () => {
      let deepObj: any = { value: 'safe' };
      for (let i = 0; i < 25; i++) {
        deepObj = { nested: deepObj };
      }
      deepObj.nested.nested.nested.value = '<script>alert(1)</script>';
      
      const findings = scanObjectForThreats(deepObj);
      // Should stop at MAX_DEPTH and not crash
      expect(findings).toBeDefined();
    });

    it('should truncate very long strings', () => {
      const longString = '<script>' + 'a'.repeat(20000) + '</script>';
      const findings = scanObjectForThreats(longString);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].value.length).toBeLessThan(15000);
    });

    it('should handle null and undefined values', () => {
      const input = {
        name: 'John',
        nullValue: null,
        undefinedValue: undefined,
      };
      const findings = scanObjectForThreats(input);
      expect(findings).toHaveLength(0);
    });

    it('should detect multiple threats in same object', () => {
      const input = {
        sql: "' OR '1'='1",
        xss: '<script>alert(1)</script>',
        safe: 'normal',
      };
      const findings = scanObjectForThreats(input);
      expect(findings.length).toBe(2);
      const types = findings.map(f => f.type);
      expect(types).toContain('sql_injection');
      expect(types).toContain('xss');
    });

    it('should provide correct paths for arrays', () => {
      const input = [
        'safe',
        '<script>alert(1)</script>',
        { nested: "' OR '1'='1" },
      ];
      const findings = scanObjectForThreats(input);
      expect(findings.length).toBe(2);
      expect(findings[0].path).toContain('[1]');
      expect(findings[1].path).toContain('[2].nested');
    });

    it('should handle empty objects and arrays', () => {
      const input = {
        emptyObj: {},
        emptyArr: [],
        safe: 'text',
      };
      const findings = scanObjectForThreats(input);
      expect(findings).toHaveLength(0);
    });

    it('should detect SQL injection patterns', () => {
      const sqlPatterns = [
        "admin' OR '1'='1'--",
        "'; DROP TABLE users;--",
        "1' UNION SELECT * FROM passwords--",
      ];
      sqlPatterns.forEach(pattern => {
        const findings = scanObjectForThreats(pattern);
        expect(findings.length).toBeGreaterThan(0);
        expect(findings[0].type).toBe('sql_injection');
      });
    });

    it('should detect XSS patterns', () => {
      const xssPatterns = [
        '<script>alert(document.cookie)</script>',
        '<img src=x onerror=alert(1)>',
        '<iframe src="javascript:alert(1)">',
      ];
      xssPatterns.forEach(pattern => {
        const findings = scanObjectForThreats(pattern);
        expect(findings.length).toBeGreaterThan(0);
        expect(findings[0].type).toBe('xss');
      });
    });

    it('should include the malicious value in findings', () => {
      const malicious = '<script>alert(1)</script>';
      const findings = scanObjectForThreats(malicious);
      expect(findings[0].value).toBe(malicious);
    });
  });
});

