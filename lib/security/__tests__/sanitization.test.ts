/**
 * Tests pour le module de sanitization
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeForDatabase,
  sanitizeId,
  sanitizeObject,
  sanitizeForUrl,
  sanitizeEmail,
  sanitizePhone,
  detectSqlInjection,
  detectXss,
  isSafeInput,
} from '../sanitization';

describe('Sanitization Module', () => {
  describe('sanitizeHtml', () => {
    it('should remove all HTML tags in strict mode', () => {
      const input = '<script>alert("XSS")</script><p>Hello</p>';
      const result = sanitizeHtml(input, true);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<p>');
      expect(result).toContain('alert');
      expect(result).toContain('Hello');
    });

    it('should allow safe tags in permissive mode', () => {
      const input = '<b>Bold</b><p>Paragraph</p>';
      const result = sanitizeHtml(input, false);
      expect(result).toContain('<b>');
      expect(result).toContain('<p>');
    });

    it('should remove dangerous scripts', () => {
      const input = '<script>alert("XSS")</script>';
      const result = sanitizeHtml(input, false);
      expect(result).not.toContain('<script>');
    });

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });

    it('should remove onclick handlers', () => {
      const input = '<div onclick="alert(1)">Click</div>';
      const result = sanitizeHtml(input, false);
      expect(result).not.toContain('onclick');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      const result = sanitizeHtml(input, false);
      expect(result).not.toContain('<iframe>');
    });
  });

  describe('sanitizeText', () => {
    it('should remove all HTML tags', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = sanitizeText(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Hello');
    });

    it('should handle special characters', () => {
      const input = '<>&"\'';
      const result = sanitizeText(input);
      expect(result).toBeTruthy();
    });

    it('should return empty string for invalid input', () => {
      expect(sanitizeText(null as any)).toBe('');
      expect(sanitizeText(undefined as any)).toBe('');
    });
  });

  describe('sanitizeForDatabase', () => {
    it('should remove dangerous characters', () => {
      const input = "test'; DROP TABLE users;--";
      const result = sanitizeForDatabase(input);
      expect(result).not.toContain("'");
      expect(result).not.toContain(';');
      expect(result).not.toContain('--');
    });

    it('should remove quotes and backslashes', () => {
      const input = 'test\\"value\\';
      const result = sanitizeForDatabase(input);
      expect(result).not.toContain('\\');
      expect(result).not.toContain('"');
    });

    it('should remove chevrons', () => {
      const input = '<test>value</test>';
      const result = sanitizeForDatabase(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should trim whitespace', () => {
      const input = '  test  ';
      const result = sanitizeForDatabase(input);
      expect(result).toBe('test');
    });
  });

  describe('sanitizeId', () => {
    it('should allow valid Firestore IDs', () => {
      const validIds = ['abc123', 'user_123', 'test-id', 'a1B2c3_D4-e5'];
      validIds.forEach(id => {
        const result = sanitizeId(id);
        expect(result).toBe(id);
      });
    });

    it('should remove invalid characters', () => {
      const input = 'test@#$%id';
      const result = sanitizeId(input);
      expect(result).toBe('testid');
    });

    it('should return null for empty input', () => {
      expect(sanitizeId('')).toBeNull();
      expect(sanitizeId('   ')).toBeNull();
    });

    it('should return null for IDs that are too long', () => {
      const longId = 'a'.repeat(1501);
      expect(sanitizeId(longId)).toBeNull();
    });

    it('should handle mixed case', () => {
      const input = 'Test_ID-123';
      const result = sanitizeId(input);
      expect(result).toBe('Test_ID-123');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize all string values in an object', () => {
      const input = {
        name: '<script>alert("XSS")</script>Test',
        email: 'test@test.com',
      };
      const result = sanitizeObject(input, { text: true });
      expect(result.name).not.toContain('<script>');
      expect(result.email).toBe('test@test.com');
    });

    it('should handle nested objects with deep option', () => {
      const input = {
        user: {
          name: '<b>Bold</b>',
          profile: {
            bio: '<script>alert(1)</script>',
          },
        },
      };
      const result = sanitizeObject(input, { text: true, deep: true });
      expect(result.user.name).not.toContain('<b>');
      expect(result.user.profile.bio).not.toContain('<script>');
    });

    it('should preserve non-string values', () => {
      const input = {
        name: 'Test',
        age: 30,
        active: true,
      };
      const result = sanitizeObject(input, { text: true });
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
    });
  });

  describe('sanitizeForUrl', () => {
    it('should convert to lowercase', () => {
      const input = 'Hello World';
      const result = sanitizeForUrl(input);
      expect(result).toBe('hello-world');
    });

    it('should replace spaces with hyphens', () => {
      const input = 'test url slug';
      const result = sanitizeForUrl(input);
      expect(result).toBe('test-url-slug');
    });

    it('should remove special characters', () => {
      const input = 'test@#$%url';
      const result = sanitizeForUrl(input);
      expect(result).toBe('test-url');
    });

    it('should remove multiple consecutive hyphens', () => {
      const input = 'test---url';
      const result = sanitizeForUrl(input);
      expect(result).toBe('test-url');
    });

    it('should remove leading and trailing hyphens', () => {
      const input = '-test-url-';
      const result = sanitizeForUrl(input);
      expect(result).toBe('test-url');
    });
  });

  describe('sanitizeEmail', () => {
    it('should convert to lowercase', () => {
      const input = 'Test@Example.COM';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com');
    });

    it('should remove chevrons', () => {
      const input = '<test@example.com>';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com');
    });

    it('should remove spaces', () => {
      const input = ' test @ example.com ';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const input = '  test@example.com  ';
      const result = sanitizeEmail(input);
      expect(result).toBe('test@example.com');
    });
  });

  describe('sanitizePhone', () => {
    it('should keep only numbers and plus sign', () => {
      const input = '+33 1 23 45 67 89';
      const result = sanitizePhone(input);
      expect(result).toBe('+33123456789');
    });

    it('should remove letters and special characters', () => {
      const input = 'Tel: +33 (0)1 23 45 67 89';
      const result = sanitizePhone(input);
      expect(result).toBe('+33012345678');
    });

    it('should handle French phone format', () => {
      const input = '01.23.45.67.89';
      const result = sanitizePhone(input);
      expect(result).toBe('0123456789');
    });
  });

  describe('detectSqlInjection', () => {
    it('should detect SELECT statements', () => {
      const inputs = [
        "SELECT * FROM users",
        "select * from users",
        "' OR '1'='1",
        "admin' OR 1=1--",
      ];
      inputs.forEach(input => {
        expect(detectSqlInjection(input)).toBe(true);
      });
    });

    it('should detect UNION attacks', () => {
      const input = "' UNION SELECT password FROM users--";
      expect(detectSqlInjection(input)).toBe(true);
    });

    it('should detect comment injections', () => {
      const inputs = [
        "admin'--",
        "test'; --",
        "value /* comment */",
      ];
      inputs.forEach(input => {
        expect(detectSqlInjection(input)).toBe(true);
      });
    });

    it('should not flag normal text', () => {
      const inputs = [
        'normal text',
        'email@example.com',
        'John Doe',
      ];
      inputs.forEach(input => {
        expect(detectSqlInjection(input)).toBe(false);
      });
    });

    it('should handle empty input', () => {
      expect(detectSqlInjection('')).toBe(false);
      expect(detectSqlInjection(null as any)).toBe(false);
    });
  });

  describe('detectXss', () => {
    it('should detect script tags', () => {
      const inputs = [
        '<script>alert("XSS")</script>',
        '<SCRIPT>alert(1)</SCRIPT>',
        '<script src="evil.js">',
      ];
      inputs.forEach(input => {
        expect(detectXss(input)).toBe(true);
      });
    });

    it('should detect javascript: protocol', () => {
      const input = '<a href="javascript:alert(1)">Click</a>';
      expect(detectXss(input)).toBe(true);
    });

    it('should detect event handlers', () => {
      const inputs = [
        '<div onclick="alert(1)">',
        '<img onerror="alert(1)">',
        '<body onload="alert(1)">',
      ];
      inputs.forEach(input => {
        expect(detectXss(input)).toBe(true);
      });
    });

    it('should detect iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe>';
      expect(detectXss(input)).toBe(true);
    });

    it('should detect object and embed tags', () => {
      const inputs = [
        '<object data="evil.swf">',
        '<embed src="evil.swf">',
      ];
      inputs.forEach(input => {
        expect(detectXss(input)).toBe(true);
      });
    });

    it('should not flag normal HTML', () => {
      const inputs = [
        '<p>Normal paragraph</p>',
        '<div>Content</div>',
        'Plain text',
      ];
      inputs.forEach(input => {
        expect(detectXss(input)).toBe(false);
      });
    });
  });

  describe('isSafeInput', () => {
    it('should detect SQL injection', () => {
      const input = "' OR '1'='1";
      const result = isSafeInput(input);
      expect(result.safe).toBe(false);
      expect(result.reason).toBe('SQL injection detected');
    });

    it('should detect XSS', () => {
      const input = '<script>alert(1)</script>';
      const result = isSafeInput(input);
      expect(result.safe).toBe(false);
      expect(result.reason).toBe('XSS detected');
    });

    it('should pass safe input', () => {
      const inputs = [
        'John Doe',
        'email@example.com',
        'Normal text 123',
      ];
      inputs.forEach(input => {
        const result = isSafeInput(input);
        expect(result.safe).toBe(true);
        expect(result.reason).toBeUndefined();
      });
    });
  });
});

