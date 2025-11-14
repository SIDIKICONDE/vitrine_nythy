/**
 * Tests pour le module Rate Limiter Distribué
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import {
  getClientIp,
  getRateLimitKey,
  getRateLimitConfigForEndpoint,
  RATE_LIMIT_TIERS,
} from '../rate-limiter-distributed';

describe('Rate Limiter Distributed Module', () => {
  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });
      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });
      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.2');
    });

    it('should prioritize x-forwarded-for over x-real-ip', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
        },
      });
      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should handle x-forwarded-for with multiple IPs', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
        },
      });
      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should trim whitespace from IP', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '  192.168.1.1  ',
        },
      });
      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should fallback to cf-connecting-ip', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'cf-connecting-ip': '192.168.1.3',
        },
      });
      const ip = getClientIp(request);
      expect(ip).toBeTruthy();
    });
  });

  describe('getRateLimitKey', () => {
    it('should generate IP-based key', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });
      const key = getRateLimitKey(request, 'ip');
      expect(key).toBe('ip:192.168.1.1');
    });

    it('should generate user-based key with userId', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });
      const key = getRateLimitKey(request, 'user', 'user123');
      expect(key).toBe('user:user123');
    });

    it('should fallback to IP for user tier without userId', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });
      const key = getRateLimitKey(request, 'user');
      expect(key).toBe('ip:192.168.1.1');
    });

    it('should generate endpoint-based key', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });
      const key = getRateLimitKey(request, 'endpoint');
      expect(key).toBe('endpoint:192.168.1.1:/api/test');
    });

    it('should default to IP tier', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });
      const key = getRateLimitKey(request);
      expect(key).toBe('ip:192.168.1.1');
    });
  });

  describe('getRateLimitConfigForEndpoint', () => {
    it('should return strict config for login endpoint', () => {
      const config = getRateLimitConfigForEndpoint('/api/login');
      expect(config).toEqual(RATE_LIMIT_TIERS['strict']);
      expect(config.maxRequests).toBe(5);
    });

    it('should return strict config for register endpoint', () => {
      const config = getRateLimitConfigForEndpoint('/api/register');
      expect(config).toEqual(RATE_LIMIT_TIERS['strict']);
    });

    it('should return strict config for password reset', () => {
      const config = getRateLimitConfigForEndpoint('/api/reset-password');
      expect(config).toEqual(RATE_LIMIT_TIERS['strict']);
    });

    it('should return moderate config for create endpoints', () => {
      const config = getRateLimitConfigForEndpoint('/api/products/create');
      expect(config).toEqual(RATE_LIMIT_TIERS['moderate']);
      expect(config.maxRequests).toBe(60);
    });

    it('should return moderate config for update endpoints', () => {
      const config = getRateLimitConfigForEndpoint('/api/products/update');
      expect(config).toEqual(RATE_LIMIT_TIERS['moderate']);
    });

    it('should return moderate config for delete endpoints', () => {
      const config = getRateLimitConfigForEndpoint('/api/products/delete');
      expect(config).toEqual(RATE_LIMIT_TIERS['moderate']);
    });

    it('should return standard config for read API endpoints', () => {
      const config = getRateLimitConfigForEndpoint('/api/products');
      expect(config).toEqual(RATE_LIMIT_TIERS['standard']);
      expect(config.maxRequests).toBe(300);
    });

    it('should return permissive config for public pages', () => {
      const config = getRateLimitConfigForEndpoint('/about');
      expect(config).toEqual(RATE_LIMIT_TIERS['permissive']);
      expect(config.maxRequests).toBe(1000);
    });

    it('should return permissive config for home page', () => {
      const config = getRateLimitConfigForEndpoint('/');
      expect(config).toEqual(RATE_LIMIT_TIERS['permissive']);
    });
  });

  describe('RATE_LIMIT_TIERS', () => {
    it('should have strict tier with correct limits', () => {
      expect(RATE_LIMIT_TIERS['strict']).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 5,
      });
    });

    it('should have moderate tier with correct limits', () => {
      expect(RATE_LIMIT_TIERS['moderate']).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 60,
      });
    });

    it('should have standard tier with correct limits', () => {
      expect(RATE_LIMIT_TIERS['standard']).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 300,
      });
    });

    it('should have permissive tier with correct limits', () => {
      expect(RATE_LIMIT_TIERS['permissive']).toEqual({
        windowMs: 60 * 1000,
        maxRequests: 1000,
      });
    });

    it('should have all tiers with 60 second window', () => {
      Object.values(RATE_LIMIT_TIERS).forEach(tier => {
        expect(tier.windowMs).toBe(60 * 1000);
      });
    });

    it('should have increasing limits from strict to permissive', () => {
      const tiers = Object.values(RATE_LIMIT_TIERS);
      for (let i = 1; i < tiers.length; i++) {
        const currentTier = tiers[i];
        const previousTier = tiers[i - 1];
        if (currentTier && previousTier) {
          expect(currentTier.maxRequests).toBeGreaterThan(previousTier.maxRequests);
        }
      }
    });
  });
});

