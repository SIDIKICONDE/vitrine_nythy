/**
 * Tests pour le module de validation de fichiers
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateFileBasics,
  getFileExtension,
  sanitizeStoragePath,
  validateFileSignature,
} from '../file-validation';

describe('File Validation Module', () => {
  describe('validateFileBasics', () => {
    it('should accept valid JPEG file', () => {
      const file = new File(['fake content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      const result = validateFileBasics(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid PNG file', () => {
      const file = new File(['fake content'], 'test.png', { type: 'image/png' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      const result = validateFileBasics(file);
      expect(result.valid).toBe(true);
    });

    it('should accept valid WebP file', () => {
      const file = new File(['fake content'], 'test.webp', { type: 'image/webp' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
      const result = validateFileBasics(file);
      expect(result.valid).toBe(true);
    });

    it('should reject file with disallowed MIME type', () => {
      const file = new File(['fake content'], 'test.exe', { type: 'application/x-executable' });
      Object.defineProperty(file, 'size', { value: 1024 });
      const result = validateFileBasics(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('non autorisé');
    });

    it('should reject empty file', () => {
      const file = new File([], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 0 });
      const result = validateFileBasics(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('vide');
    });

    it('should reject file that is too large', () => {
      const file = new File(['fake content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB
      const result = validateFileBasics(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('volumineux');
    });

    it('should reject file without extension', () => {
      const file = new File(['fake content'], 'test', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });
      const result = validateFileBasics(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Extension');
    });

    it('should reject file with mismatched extension', () => {
      const file = new File(['fake content'], 'test.png', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });
      const result = validateFileBasics(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('correspond pas');
    });

    it('should reject file with double extension', () => {
      const file = new File(['fake content'], 'test.jpg.exe', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 1024 });
      const result = validateFileBasics(file);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('multiple');
    });

    it('should accept file with custom size limit', () => {
      const file = new File(['fake content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 8 * 1024 * 1024 }); // 8MB
      const result = validateFileBasics(file, { maxSizeMB: 10 });
      expect(result.valid).toBe(true);
    });

    it('should reject file exceeding custom size limit', () => {
      const file = new File(['fake content'], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(file, 'size', { value: 8 * 1024 * 1024 }); // 8MB
      const result = validateFileBasics(file, { maxSizeMB: 5 });
      expect(result.valid).toBe(false);
    });
  });

  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('test.jpg')).toBe('jpg');
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.PNG')).toBe('png');
    });

    it('should handle filenames with multiple dots', () => {
      expect(getFileExtension('my.file.name.jpg')).toBe('jpg');
    });

    it('should return null for files without extension', () => {
      expect(getFileExtension('test')).toBeNull();
      expect(getFileExtension('readme')).toBeNull();
    });

    it('should trim and lowercase', () => {
      expect(getFileExtension('  Test.JPG  ')).toBe('jpg');
    });

    it('should handle empty string', () => {
      expect(getFileExtension('')).toBeNull();
    });
  });

  describe('sanitizeStoragePath', () => {
    it('should accept valid paths', () => {
      const validPaths = [
        'images/test.jpg',
        'user/123/profile.png',
        'products/category/item.webp',
      ];
      validPaths.forEach(path => {
        const result = sanitizeStoragePath(path);
        expect(result).toBeTruthy();
      });
    });

    it('should normalize path separators', () => {
      const result = sanitizeStoragePath('images\\test.jpg');
      expect(result).toBe('images/test.jpg');
    });

    it('should remove leading slash', () => {
      const result = sanitizeStoragePath('/images/test.jpg');
      expect(result).toBe('images/test.jpg');
    });

    it('should reject paths with directory traversal', () => {
      const maliciousPaths = [
        '../../../etc/passwd',
        'images/../../secrets',
        'test/../../../file',
      ];
      maliciousPaths.forEach(path => {
        const result = sanitizeStoragePath(path);
        expect(result).toBeNull();
      });
    });

    it('should return null for empty path', () => {
      expect(sanitizeStoragePath('')).toBeNull();
      expect(sanitizeStoragePath(null as any)).toBeNull();
    });

    it('should sanitize HTML in path', () => {
      const result = sanitizeStoragePath('<script>alert(1)</script>/test.jpg');
      expect(result).not.toContain('<script>');
    });
  });

  describe('validateFileSignature', () => {
    it('should validate JPEG signature', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(validateFileSignature(jpegBuffer, 'image/jpeg')).toBe(true);
    });

    it('should validate PNG signature', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(validateFileSignature(pngBuffer, 'image/png')).toBe(true);
    });

    it('should validate WebP signature', () => {
      const webpBuffer = Buffer.from('RIFF....WEBP', 'ascii');
      expect(validateFileSignature(webpBuffer, 'image/webp')).toBe(true);
    });

    it('should validate SVG signature', () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">', 'utf8');
      expect(validateFileSignature(svgBuffer, 'image/svg+xml')).toBe(true);
    });

    it('should reject invalid JPEG signature', () => {
      const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(validateFileSignature(invalidBuffer, 'image/jpeg')).toBe(false);
    });

    it('should reject invalid PNG signature', () => {
      const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(validateFileSignature(invalidBuffer, 'image/png')).toBe(false);
    });

    it('should reject mismatched file signature', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
      expect(validateFileSignature(jpegBuffer, 'image/png')).toBe(false);
    });

    it('should return false for unsupported MIME type', () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      expect(validateFileSignature(buffer, 'application/pdf')).toBe(false);
    });
  });
});

