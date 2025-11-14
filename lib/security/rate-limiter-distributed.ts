/**
 * Rate Limiter Distribué avec Redis (Upstash)
 * 
 * Implémentation production-ready avec:
 * - Sliding window algorithm
 * - Support multi-région
 * - Fallback en mémoire si Redis indisponible
 * - Différents tiers (IP, User, Endpoint)
 * - Whitelist/Blacklist
 * - Analytics en temps réel
 */

import type { NextRequest } from 'next/server';

// ==================== TYPES ====================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface RateLimitTier {
  name: string;
  config: RateLimitConfig;
  priority: number;
}

// ==================== CONFIGURATION ====================

// Tiers de rate limiting
export const RATE_LIMIT_TIERS = {
  // Strict pour les endpoints sensibles (login, register, etc.)
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5,
  },
  // Modéré pour les API mutations
  moderate: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  // Standard pour les API reads
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300,
  },
  // Permissif pour les assets et pages publiques
  permissive: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
  },
} as const;

// Whitelist d'IPs (admin, monitoring, etc.)
const IP_WHITELIST = new Set(
  (process.env['RATE_LIMIT_IP_WHITELIST'] || '').split(',').filter(Boolean)
);

// Blacklist d'IPs (attaquants connus)
const IP_BLACKLIST = new Set<string>();

// ==================== IN-MEMORY FALLBACK ====================

interface MemoryEntry {
  requests: number[];
  resetAt: number;
}

class InMemoryRateLimiter {
  private store = new Map<string, MemoryEntry>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly MAX_ENTRIES = 100000;

  constructor() {
    // Cleanup toutes les 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  check(key: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let entry = this.store.get(key);

    // Nettoyer les anciennes requêtes
    if (entry) {
      entry.requests = entry.requests.filter(timestamp => timestamp > windowStart);
    } else {
      entry = { requests: [], resetAt: now + config.windowMs };
      this.store.set(key, entry);
    }

    const currentCount = entry.requests.length;
    const allowed = currentCount < config.maxRequests;

    if (allowed) {
      entry.requests.push(now);
      entry.resetAt = now + config.windowMs;
    }

    // Limiter la taille du store (protection mémoire)
    if (this.store.size > this.MAX_ENTRIES) {
      this.cleanup();
    }

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0)),
      resetAt: entry.resetAt,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  private cleanup(): void {
    const now = Date.now();
    let deleted = 0;

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetAt < now) {
        this.store.delete(key);
        deleted++;
      }
    }

    if (deleted > 0) {
      console.log(`[RateLimiter] Cleaned up ${deleted} expired entries`);
    }

    // Si encore trop d'entrées, supprimer les plus anciennes
    if (this.store.size > this.MAX_ENTRIES) {
      const entries = Array.from(this.store.entries())
        .sort((a, b) => a[1].resetAt - b[1].resetAt);

      const toDelete = entries.slice(0, Math.floor(this.MAX_ENTRIES * 0.2));
      toDelete.forEach(([key]) => this.store.delete(key));

      console.log(`[RateLimiter] Force deleted ${toDelete.length} oldest entries`);
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Instance globale du fallback
const memoryLimiter = new InMemoryRateLimiter();

// ==================== REDIS IMPLEMENTATION ====================

class RedisRateLimiter {
  private redisAvailable = false;
  private redis: any = null;

  async initialize(): Promise<void> {
    try {
      // Vérifier si les variables d'environnement Redis sont présentes
      if (!process.env['UPSTASH_REDIS_REST_URL'] || !process.env['UPSTASH_REDIS_REST_TOKEN']) {
        console.warn('[RateLimiter] Redis credentials not found, using in-memory fallback');
        return;
      }

      // Import dynamique pour éviter les erreurs si le package n'est pas installé
      const { Redis } = await import('@upstash/redis');

      this.redis = new Redis({
        url: process.env['UPSTASH_REDIS_REST_URL'],
        token: process.env['UPSTASH_REDIS_REST_TOKEN'],
      });

      // Test de connexion
      await this.redis.ping();
      this.redisAvailable = true;
      console.log('[RateLimiter] Redis connected successfully');
    } catch (error) {
      console.warn('[RateLimiter] Redis initialization failed, using in-memory fallback:', error);
      this.redisAvailable = false;
    }
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    // Fallback si Redis n'est pas disponible
    if (!this.redisAvailable || !this.redis) {
      return memoryLimiter.check(key, config);
    }

    try {
      const now = Date.now();
      const windowStart = now - config.windowMs;
      const redisKey = `ratelimit:${key}`;

      // Utiliser un pipeline Redis pour atomicité
      const pipeline = this.redis.pipeline();

      // Supprimer les anciennes entrées
      pipeline.zremrangebyscore(redisKey, 0, windowStart);

      // Compter les requêtes dans la fenêtre
      pipeline.zcard(redisKey);

      // Ajouter la nouvelle requête
      pipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });

      // Définir l'expiration
      pipeline.expire(redisKey, Math.ceil(config.windowMs / 1000));

      const results = await pipeline.exec();
      const currentCount = (results[1] as number) || 0;
      const allowed = currentCount < config.maxRequests;

      const resetAt = now + config.windowMs;

      return {
        allowed,
        remaining: Math.max(0, config.maxRequests - currentCount - (allowed ? 1 : 0)),
        resetAt,
        retryAfter: allowed ? undefined : Math.ceil((resetAt - now) / 1000),
      };
    } catch (error) {
      console.error('[RateLimiter] Redis error, falling back to memory:', error);
      // Fallback en cas d'erreur Redis
      return memoryLimiter.check(key, config);
    }
  }

  async blacklistIp(ip: string, durationMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    IP_BLACKLIST.add(ip);

    if (this.redisAvailable && this.redis) {
      try {
        await this.redis.setex(
          `blacklist:${ip}`,
          Math.ceil(durationMs / 1000),
          '1'
        );
      } catch (error) {
        console.error('[RateLimiter] Failed to blacklist IP in Redis:', error);
      }
    }
  }

  async isBlacklisted(ip: string): Promise<boolean> {
    if (IP_BLACKLIST.has(ip)) {
      return true;
    }

    if (this.redisAvailable && this.redis) {
      try {
        const result = await this.redis.get(`blacklist:${ip}`);
        return result !== null;
      } catch (error) {
        console.error('[RateLimiter] Failed to check blacklist in Redis:', error);
      }
    }

    return false;
  }

  async getStats(key: string): Promise<{ count: number; oldestRequest: number | null }> {
    if (!this.redisAvailable || !this.redis) {
      return { count: 0, oldestRequest: null };
    }

    try {
      const redisKey = `ratelimit:${key}`;
      const [count, oldest] = await Promise.all([
        this.redis.zcard(redisKey),
        this.redis.zrange(redisKey, 0, 0, { withScores: true }),
      ]);

      return {
        count: count || 0,
        oldestRequest: oldest && oldest.length > 0 ? oldest[0].score : null,
      };
    } catch (error) {
      console.error('[RateLimiter] Failed to get stats:', error);
      return { count: 0, oldestRequest: null };
    }
  }
}

// Instance globale
const redisLimiter = new RedisRateLimiter();

// Initialiser Redis au démarrage (lazy)
let initPromise: Promise<void> | null = null;
async function ensureInitialized(): Promise<void> {
  if (!initPromise) {
    initPromise = redisLimiter.initialize();
  }
  await initPromise;
}

// ==================== API PUBLIQUE ====================

/**
 * Extrait l'IP du client
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    // Prendre la première IP (client réel)
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback (ne devrait jamais arriver en production)
  return request.headers.get('cf-connecting-ip') || 'unknown';
}

/**
 * Génère une clé de rate limiting composite
 */
export function getRateLimitKey(
  request: NextRequest,
  tier: 'ip' | 'user' | 'endpoint' = 'ip',
  userId?: string
): string {
  const ip = getClientIp(request);
  const endpoint = request.nextUrl.pathname;

  switch (tier) {
    case 'ip':
      return `ip:${ip}`;
    case 'user':
      return userId ? `user:${userId}` : `ip:${ip}`;
    case 'endpoint':
      return `endpoint:${ip}:${endpoint}`;
    default:
      return `ip:${ip}`;
  }
}

/**
 * Vérifie le rate limit pour une requête
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMIT_TIERS['standard'],
  options: {
    tier?: 'ip' | 'user' | 'endpoint';
    userId?: string;
    skipWhitelist?: boolean;
  } = {}
): Promise<RateLimitResult> {
  await ensureInitialized();

  const ip = getClientIp(request);

  // Vérifier la whitelist
  if (!options.skipWhitelist && IP_WHITELIST.has(ip)) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
    };
  }

  // Vérifier la blacklist
  const isBlacklisted = await redisLimiter.isBlacklisted(ip);
  if (isBlacklisted) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: Date.now() + 24 * 60 * 60 * 1000, // 24h
      retryAfter: 24 * 60 * 60, // 24h en secondes
    };
  }

  const key = getRateLimitKey(request, options.tier, options.userId);
  return await redisLimiter.check(key, config);
}

/**
 * Blacklist une IP
 */
export async function blacklistIp(ip: string, durationMs?: number): Promise<void> {
  await ensureInitialized();
  await redisLimiter.blacklistIp(ip, durationMs);
}

/**
 * Vérifie si une IP est blacklistée
 */
export async function isIpBlacklisted(ip: string): Promise<boolean> {
  await ensureInitialized();
  return await redisLimiter.isBlacklisted(ip);
}

/**
 * Obtient les statistiques pour une clé
 */
export async function getRateLimitStats(key: string): Promise<{ count: number; oldestRequest: number | null }> {
  await ensureInitialized();
  return await redisLimiter.getStats(key);
}

/**
 * Détermine la configuration de rate limit selon l'endpoint
 */
export function getRateLimitConfigForEndpoint(pathname: string): RateLimitConfig {
  // Endpoints sensibles
  if (
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/reset-password') ||
    pathname.includes('/verify')
  ) {
    return RATE_LIMIT_TIERS['strict'];
  }

  // Mutations API
  if (
    pathname.startsWith('/api') &&
    (pathname.includes('/create') ||
      pathname.includes('/update') ||
      pathname.includes('/delete'))
  ) {
    return RATE_LIMIT_TIERS['moderate'];
  }

  // Lectures API
  if (pathname.startsWith('/api')) {
    return RATE_LIMIT_TIERS['standard'];
  }

  // Pages publiques
  return RATE_LIMIT_TIERS['permissive'];
}

// Cleanup au shutdown (si possible - seulement côté Node.js)
const nodeProcess =
  typeof globalThis !== 'undefined'
    ? (globalThis as { process?: NodeJS.Process }).process
    : undefined;

const canUseProcessEvents =
  typeof nodeProcess !== 'undefined' &&
  typeof nodeProcess.on === 'function' &&
  Boolean(nodeProcess?.versions?.node);

if (canUseProcessEvents) {
  nodeProcess!.on('beforeExit', () => {
    memoryLimiter.destroy();
  });
}

