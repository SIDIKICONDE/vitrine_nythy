/**
 * Tests pour le module de validation
 */

import { describe, it, expect } from '@jest/globals';
import { z } from 'zod';
import {
  emailSchema,
  passwordSchema,
  businessNameSchema,
  siretSchema,
  ibanSchema,
  urlSchema,
  idSchema,
  priceSchema,
  quantitySchema,
  phoneSchema,
  merchantRegisterSchema,
  validateData,
} from '../validation';

describe('Validation Module', () => {
  describe('emailSchema', () => {
    it('should validate correct emails', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.co.uk',
        'email+tag@domain.com',
      ];
      validEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).not.toThrow();
      });
    });

    it('should convert to lowercase', () => {
      const result = emailSchema.parse('Test@Example.COM');
      expect(result).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const result = emailSchema.parse('  test@example.com  ');
      expect(result).toBe('test@example.com');
    });

    it('should reject invalid emails', () => {
      const invalidEmails = [
        'not-an-email',
        '@example.com',
        'test@',
        'test',
        'test@.com',
      ];
      invalidEmails.forEach(email => {
        expect(() => emailSchema.parse(email)).toThrow();
      });
    });

    it('should reject emails that are too short', () => {
      expect(() => emailSchema.parse('a@b.c')).toThrow();
    });

    it('should reject emails that are too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(() => emailSchema.parse(longEmail)).toThrow();
    });
  });

  describe('passwordSchema', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'Password123!',
        'MyP@ssw0rd',
        'Secur3#Pass',
      ];
      validPasswords.forEach(password => {
        expect(() => passwordSchema.parse(password)).not.toThrow();
      });
    });

    it('should require minimum length', () => {
      expect(() => passwordSchema.parse('Short1!')).toThrow();
    });

    it('should require uppercase letter', () => {
      expect(() => passwordSchema.parse('password123!')).toThrow();
    });

    it('should require lowercase letter', () => {
      expect(() => passwordSchema.parse('PASSWORD123!')).toThrow();
    });

    it('should require number', () => {
      expect(() => passwordSchema.parse('Password!')).toThrow();
    });

    it('should require special character', () => {
      expect(() => passwordSchema.parse('Password123')).toThrow();
    });

    it('should reject passwords that are too long', () => {
      const longPassword = 'A1!' + 'a'.repeat(130);
      expect(() => passwordSchema.parse(longPassword)).toThrow();
    });
  });

  describe('businessNameSchema', () => {
    it('should validate correct business names', () => {
      const validNames = [
        'Café de Paris',
        "Restaurant L'Étoile",
        'Boulangerie-Pâtisserie',
        'ABC Company 123',
      ];
      validNames.forEach(name => {
        expect(() => businessNameSchema.parse(name)).not.toThrow();
      });
    });

    it('should trim whitespace', () => {
      const result = businessNameSchema.parse('  Test Business  ');
      expect(result).toBe('Test Business');
    });

    it('should reject names that are too short', () => {
      expect(() => businessNameSchema.parse('A')).toThrow();
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(101);
      expect(() => businessNameSchema.parse(longName)).toThrow();
    });

    it('should reject names with invalid characters', () => {
      const invalidNames = [
        'Test<script>',
        'Name@Business',
        'Test#Company',
      ];
      invalidNames.forEach(name => {
        expect(() => businessNameSchema.parse(name)).toThrow();
      });
    });
  });

  describe('siretSchema', () => {
    it('should validate correct SIRET', () => {
      const validSirets = [
        '12345678901234',
        '98765432109876',
      ];
      validSirets.forEach(siret => {
        expect(() => siretSchema.parse(siret)).not.toThrow();
      });
    });

    it('should trim whitespace', () => {
      const result = siretSchema.parse('  12345678901234  ');
      expect(result).toBe('12345678901234');
    });

    it('should reject SIRET with wrong length', () => {
      expect(() => siretSchema.parse('123456789012')).toThrow();
      expect(() => siretSchema.parse('123456789012345')).toThrow();
    });

    it('should reject SIRET with non-numeric characters', () => {
      expect(() => siretSchema.parse('1234567890123A')).toThrow();
    });
  });

  describe('ibanSchema', () => {
    it('should validate correct IBAN', () => {
      const validIbans = [
        'FR7612345678901234567890123',
        'DE12345678901234567890',
      ];
      validIbans.forEach(iban => {
        expect(() => ibanSchema.parse(iban)).not.toThrow();
      });
    });

    it('should convert to uppercase', () => {
      const result = ibanSchema.parse('fr7612345678901234567890123');
      expect(result).toBe('FR7612345678901234567890123');
    });

    it('should trim whitespace', () => {
      const result = ibanSchema.parse('  FR7612345678901234567890123  ');
      expect(result).toBe('FR7612345678901234567890123');
    });

    it('should reject invalid IBAN format', () => {
      const invalidIbans = [
        '1234567890',
        'INVALID',
        'FR76',
      ];
      invalidIbans.forEach(iban => {
        expect(() => ibanSchema.parse(iban)).toThrow();
      });
    });
  });

  describe('urlSchema', () => {
    it('should validate correct URLs', () => {
      const validUrls = [
        'https://example.com',
        'http://test.example.co.uk',
        'https://sub.domain.example.com/path?query=value',
      ];
      validUrls.forEach(url => {
        expect(() => urlSchema.parse(url)).not.toThrow();
      });
    });

    it('should trim whitespace', () => {
      const result = urlSchema.parse('  https://example.com  ');
      expect(result).toBe('https://example.com');
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'not-a-url',
        'ftp://example.com',
        'example.com',
      ];
      invalidUrls.forEach(url => {
        expect(() => urlSchema.parse(url)).toThrow();
      });
    });

    it('should reject URLs that are too long', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2050);
      expect(() => urlSchema.parse(longUrl)).toThrow();
    });
  });

  describe('idSchema', () => {
    it('should validate correct IDs', () => {
      const validIds = [
        'abc123',
        'user_123',
        'test-id',
        'ABC_123-xyz',
      ];
      validIds.forEach(id => {
        expect(() => idSchema.parse(id)).not.toThrow();
      });
    });

    it('should reject IDs with invalid characters', () => {
      const invalidIds = [
        'test@id',
        'id#123',
        'test.id',
      ];
      invalidIds.forEach(id => {
        expect(() => idSchema.parse(id)).toThrow();
      });
    });

    it('should reject empty IDs', () => {
      expect(() => idSchema.parse('')).toThrow();
    });

    it('should reject IDs that are too long', () => {
      const longId = 'a'.repeat(129);
      expect(() => idSchema.parse(longId)).toThrow();
    });
  });

  describe('priceSchema', () => {
    it('should validate correct prices', () => {
      const validPrices = [10.99, 100, 0.01, 999999.99];
      validPrices.forEach(price => {
        expect(() => priceSchema.parse(price)).not.toThrow();
      });
    });

    it('should reject negative prices', () => {
      expect(() => priceSchema.parse(-10)).toThrow();
    });

    it('should reject zero price', () => {
      expect(() => priceSchema.parse(0)).toThrow();
    });

    it('should reject prices that are too high', () => {
      expect(() => priceSchema.parse(1000000)).toThrow();
    });

    it('should reject prices with more than 2 decimals', () => {
      expect(() => priceSchema.parse(10.999)).toThrow();
    });
  });

  describe('quantitySchema', () => {
    it('should validate correct quantities', () => {
      const validQuantities = [1, 10, 100, 9999];
      validQuantities.forEach(quantity => {
        expect(() => quantitySchema.parse(quantity)).not.toThrow();
      });
    });

    it('should reject non-integer quantities', () => {
      expect(() => quantitySchema.parse(10.5)).toThrow();
    });

    it('should reject negative quantities', () => {
      expect(() => quantitySchema.parse(-1)).toThrow();
    });

    it('should reject zero quantity', () => {
      expect(() => quantitySchema.parse(0)).toThrow();
    });

    it('should reject quantities that are too high', () => {
      expect(() => quantitySchema.parse(10000)).toThrow();
    });
  });

  describe('phoneSchema', () => {
    it('should validate French phone numbers', () => {
      const validPhones = [
        '+33123456789',
        '0123456789',
        '+33612345678',
      ];
      validPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).not.toThrow();
      });
    });

    it('should trim whitespace', () => {
      const result = phoneSchema.parse('  0123456789  ');
      expect(result).toBe('0123456789');
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = [
        '123456789',
        '01234567890',
        '0023456789',
        '+1234567890',
      ];
      invalidPhones.forEach(phone => {
        expect(() => phoneSchema.parse(phone)).toThrow();
      });
    });
  });

  describe('merchantRegisterSchema', () => {
    it('should validate complete merchant registration', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Password123!',
        businessName: 'Test Business',
        siret: '12345678901234',
        phone: '0123456789',
        description: 'A test business',
        address: {
          street: '123 Test Street',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
        },
      };
      expect(() => merchantRegisterSchema.parse(validData)).not.toThrow();
    });

    it('should validate minimal merchant registration', () => {
      const minimalData = {
        email: 'test@example.com',
        password: 'Password123!',
        businessName: 'Test Business',
      };
      expect(() => merchantRegisterSchema.parse(minimalData)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        password: 'Password123!',
        businessName: 'Test Business',
      };
      expect(() => merchantRegisterSchema.parse(invalidData)).toThrow();
    });

    it('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        businessName: 'Test Business',
      };
      expect(() => merchantRegisterSchema.parse(invalidData)).toThrow();
    });

    it('should validate address with coordinates', () => {
      const dataWithCoords = {
        email: 'test@example.com',
        password: 'Password123!',
        businessName: 'Test Business',
        address: {
          street: '123 Test Street',
          city: 'Paris',
          postalCode: '75001',
          country: 'France',
          latitude: 48.8566,
          longitude: 2.3522,
        },
      };
      expect(() => merchantRegisterSchema.parse(dataWithCoords)).not.toThrow();
    });
  });

  describe('validateData', () => {
    it('should return success for valid data', () => {
      const schema = z.object({ name: z.string() });
      const result = validateData(schema, { name: 'Test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ name: 'Test' });
      }
    });

    it('should return errors for invalid data', () => {
      const schema = z.object({ name: z.string() });
      const result = validateData(schema, { name: 123 });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should handle complex validation errors', () => {
      const result = validateData(emailSchema, 'not-an-email');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0].message).toContain('invalid');
      }
    });
  });
});

