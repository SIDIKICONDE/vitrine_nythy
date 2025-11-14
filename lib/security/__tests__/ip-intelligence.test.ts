/**
 * Tests pour le module IP Intelligence
 */

import { describe, it, expect } from '@jest/globals';
import {
  getIpLocation,
  recordIpBehavior,
  calculateRiskScore,
  getReputation,
  type IpAnalysis,
  type IpBehavior,
} from '../ip-intelligence';

describe('IP Intelligence Module', () => {
  describe('isPrivateIp (helpers)', () => {
    it('should detect localhost IPs via location', async () => {
      const location = await getIpLocation('127.0.0.1');
      expect(location).toBeNull(); // Local IPs return null
    });

    it('should detect private network IPs via location', async () => {
      const locations = await Promise.all([
        getIpLocation('192.168.1.1'),
        getIpLocation('10.0.0.1'),
      ]);
      locations.forEach(location => {
        expect(location).toBeNull(); // Private IPs return null
      });
    });

    it('should handle unknown IPs', async () => {
      const location = await getIpLocation('unknown');
      expect(location).toBeNull();
    });
  });

  describe('isSuspiciousIp (via calculateRiskScore)', () => {
    it('should detect IPs with high request rate', () => {
      const behavior: IpBehavior = {
        ip: '1.2.3.4',
        requestCount: 1000,
        uniqueEndpoints: new Set(['/api/test']),
        uniqueUserAgents: new Set(['Mozilla/5.0']),
        countries: new Set(['US']),
        firstSeen: new Date(Date.now() - 60000), // 1 minute ago
        lastSeen: new Date(),
        suspiciousPatterns: [],
      };
      const score = calculateRiskScore({}, behavior);
      expect(score).toBeGreaterThan(0); // High request count increases risk
    });

    it('should detect IPs with many unique endpoints', () => {
      const behavior: IpBehavior = {
        ip: '1.2.3.4',
        requestCount: 100,
        uniqueEndpoints: new Set(Array.from({ length: 150 }, (_, i) => `/api/endpoint${i}`)),
        uniqueUserAgents: new Set(['Mozilla/5.0']),
        countries: new Set(['US']),
        firstSeen: new Date(Date.now() - 60000),
        lastSeen: new Date(),
        suspiciousPatterns: [],
      };
      const score = calculateRiskScore({}, behavior);
      expect(score).toBeGreaterThan(0); // High endpoint count increases risk
    });

    it('should detect IPs with many user agents', () => {
      const behavior: IpBehavior = {
        ip: '1.2.3.4',
        requestCount: 50,
        uniqueEndpoints: new Set(['/api/test']),
        uniqueUserAgents: new Set(Array.from({ length: 15 }, (_, i) => `Agent${i}`)),
        countries: new Set(['US']),
        firstSeen: new Date(Date.now() - 60000),
        lastSeen: new Date(),
        suspiciousPatterns: [],
      };
      const score = calculateRiskScore({}, behavior);
      expect(score).toBeGreaterThan(0);
    });

    it('should detect IPs from multiple countries', () => {
      const behavior: IpBehavior = {
        ip: '1.2.3.4',
        requestCount: 50,
        uniqueEndpoints: new Set(['/api/test']),
        uniqueUserAgents: new Set(['Mozilla/5.0']),
        countries: new Set(['US', 'RU', 'CN', 'BR']),
        firstSeen: new Date(Date.now() - 60000),
        lastSeen: new Date(),
        suspiciousPatterns: [],
      };
      const score = calculateRiskScore({}, behavior);
      expect(score).toBeGreaterThan(20); // Multiple countries = suspicious
    });

    it('should detect IPs with suspicious patterns', () => {
      const behavior: IpBehavior = {
        ip: '1.2.3.4',
        requestCount: 10,
        uniqueEndpoints: new Set(['/api/test']),
        uniqueUserAgents: new Set(['Mozilla/5.0']),
        countries: new Set(['US']),
        firstSeen: new Date(Date.now() - 60000),
        lastSeen: new Date(),
        suspiciousPatterns: ['sql_injection'],
      };
      const score = calculateRiskScore({}, behavior);
      expect(score).toBeGreaterThan(0); // Suspicious patterns increase risk
    });

    it('should not flag normal behavior', () => {
      const behavior: IpBehavior = {
        ip: '1.2.3.4',
        requestCount: 10,
        uniqueEndpoints: new Set(['/api/test', '/api/products']),
        uniqueUserAgents: new Set(['Mozilla/5.0']),
        countries: new Set(['US']),
        firstSeen: new Date(Date.now() - 60000),
        lastSeen: new Date(),
        suspiciousPatterns: [],
      };
      const score = calculateRiskScore({}, behavior);
      expect(score).toBeLessThan(20); // Normal behavior = low risk
    });
  });

  describe('calculateRiskScore', () => {
    it('should return high score for VPN', () => {
      const score = calculateRiskScore({ isVpn: true });
      expect(score).toBeGreaterThan(20);
    });

    it('should return high score for Proxy', () => {
      const score = calculateRiskScore({ isProxy: true });
      expect(score).toBeGreaterThan(20);
    });

    it('should return very high score for Tor', () => {
      const score = calculateRiskScore({ isTor: true });
      expect(score).toBeGreaterThan(30);
    });

    it('should return medium score for hosting', () => {
      const score = calculateRiskScore({ isHosting: true });
      expect(score).toBeGreaterThan(10);
    });

    it('should return low score for clean IP', () => {
      const score = calculateRiskScore({});
      expect(score).toBe(0);
    });

    it('should cap score at 100', () => {
      const behavior: IpBehavior = {
        ip: '1.2.3.4',
        requestCount: 2000,
        uniqueEndpoints: new Set(Array.from({ length: 100 }, (_, i) => `/endpoint${i}`)),
        uniqueUserAgents: new Set(Array.from({ length: 20 }, (_, i) => `Agent${i}`)),
        countries: new Set(['US', 'RU', 'CN', 'BR', 'DE']),
        firstSeen: new Date(Date.now() - 60000),
        lastSeen: new Date(),
        suspiciousPatterns: ['sql_injection', 'xss', 'rate_limit'],
      };
      const score = calculateRiskScore({
        isVpn: true,
        isProxy: true,
        isTor: true,
        isHosting: true,
      }, behavior);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getReputation', () => {
    it('should return bad for high scores', () => {
      expect(getReputation(70)).toBe('bad');
      expect(getReputation(100)).toBe('bad');
    });

    it('should return suspicious for medium scores', () => {
      expect(getReputation(40)).toBe('suspicious');
      expect(getReputation(60)).toBe('suspicious');
    });

    it('should return good for low scores', () => {
      expect(getReputation(0)).toBe('good');
      expect(getReputation(30)).toBe('good');
    });
  });

  describe('getIpLocation', () => {
    it('should return null for localhost', async () => {
      const location = await getIpLocation('127.0.0.1');
      expect(location).toBeNull();
    });

    it('should return null for private IPs', async () => {
      const location = await getIpLocation('192.168.1.1');
      expect(location).toBeNull();
    });

    it('should return null for unknown IP', async () => {
      const location = await getIpLocation('unknown');
      expect(location).toBeNull();
    });
  });

  describe('recordIpBehavior', () => {
    it('should track request count', () => {
      const behavior = recordIpBehavior('1.2.3.4', '/api/test', 'Mozilla/5.0', 'US');
      expect(behavior.requestCount).toBeGreaterThanOrEqual(1);
    });

    it('should track unique endpoints', () => {
      recordIpBehavior('1.2.3.5', '/api/test1', 'Mozilla/5.0', 'US');
      const behavior = recordIpBehavior('1.2.3.5', '/api/test2', 'Mozilla/5.0', 'US');
      expect(behavior.uniqueEndpoints.size).toBe(2);
    });

    it('should track unique user agents', () => {
      recordIpBehavior('1.2.3.6', '/api/test', 'Agent1', 'US');
      const behavior = recordIpBehavior('1.2.3.6', '/api/test', 'Agent2', 'US');
      expect(behavior.uniqueUserAgents.size).toBe(2);
    });

    it('should track countries', () => {
      recordIpBehavior('1.2.3.7', '/api/test', 'Mozilla/5.0', 'US');
      const behavior = recordIpBehavior('1.2.3.7', '/api/test', 'Mozilla/5.0', 'FR');
      expect(behavior.countries.size).toBe(2);
    });

    it('should update timestamps', () => {
      const behavior = recordIpBehavior('1.2.3.8', '/api/test', 'Mozilla/5.0', 'US');
      expect(behavior.firstSeen).toBeInstanceOf(Date);
      expect(behavior.lastSeen).toBeInstanceOf(Date);
    });
  });
});

