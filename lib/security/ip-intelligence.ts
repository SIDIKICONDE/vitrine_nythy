/**
 * IP Intelligence & Geolocation
 * 
 * Analyse avancée des IPs avec:
 * - Géolocalisation
 * - Détection de VPN/Proxy/Tor
 * - Scoring de réputation
 * - Détection d'anomalies géographiques
 * - Cache pour performances
 */

import type { NextRequest } from 'next/server';

// ==================== TYPES ====================

export interface IpLocation {
  country: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

export interface IpAnalysis {
  ip: string;
  location: IpLocation | null;
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isHosting: boolean;
  riskScore: number; // 0-100
  reputation: 'good' | 'suspicious' | 'bad';
  lastSeen: Date;
}

export interface IpBehavior {
  ip: string;
  requestCount: number;
  uniqueEndpoints: Set<string>;
  uniqueUserAgents: Set<string>;
  countries: Set<string>;
  firstSeen: Date;
  lastSeen: Date;
  suspiciousPatterns: string[];
}

// ==================== CACHE ====================

const ipAnalysisCache = new Map<string, { data: IpAnalysis; expiresAt: number }>();
const ipBehaviorCache = new Map<string, IpBehavior>();
const CACHE_TTL = 60 * 60 * 1000; // 1 heure
const MAX_CACHE_SIZE = 10000;

// ==================== RUNTIME DETECTION ====================

// EDGE RUNTIME → MODE COMPATIBILITÉ
export const isEdgeRuntime = typeof (globalThis as any).EdgeRuntime === 'string';

// ==================== GEOLOCATION ====================

/**
 * Obtient la géolocalisation d'une IP
 * Edge Runtime: utilise uniquement l'API externe
 * Node.js: essaie geoip-lite puis API externe
 */
export async function getIpLocation(ip: string): Promise<IpLocation | null> {
  // Ignorer les IPs locales
  if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === '::1') {
    return null;
  }

  try {
    // 🟢 EDGE → API externe uniquement
    if (isEdgeRuntime) {
      const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,timezone`);
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          return {
            country: data.country,
            region: data.regionName,
            city: data.city,
            latitude: data.lat,
            longitude: data.lon,
            timezone: data.timezone,
          };
        }
      }
      return null;
    }

    // 🟢 NODE.JS → geoip-lite rapide
    const geoip = await import('geoip-lite');
    const geo = geoip.lookup(ip);

    if (geo) {
      return {
        country: geo.country,
        region: geo.region,
        city: geo.city || 'Unknown',
        latitude: geo.ll[0],
        longitude: geo.ll[1],
        timezone: geo.timezone,
      };
    }

    // Fallback API externe
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city,lat,lon,timezone`);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        return {
          country: data.country,
          region: data.regionName,
          city: data.city,
          latitude: data.lat,
          longitude: data.lon,
          timezone: data.timezone,
        };
      }
    }

    return null;
  } catch (error) {
    console.error('[IpIntelligence] Failed to get location:', error);
    return null;
  }
}

// ==================== VPN/PROXY DETECTION ====================

/**
 * Détecte si une IP est un VPN/Proxy/Tor
 * Utilise plusieurs heuristiques et listes publiques
 */
export async function detectVpnProxy(ip: string): Promise<{
  isVpn: boolean;
  isProxy: boolean;
  isTor: boolean;
  isHosting: boolean;
}> {
  // Ignorer les IPs locales
  if (ip === 'unknown' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return { isVpn: false, isProxy: false, isTor: false, isHosting: false };
  }

  try {
    // Vérifier les ranges de hosting connus (AWS, GCP, Azure, etc.)
    const isHosting = await isHostingProvider(ip);

    // En production, utiliser une API de détection VPN
    if (process.env['VPNAPI_KEY']) {
      const response = await fetch(`https://vpnapi.io/api/${ip}?key=${process.env['VPNAPI_KEY']}`, {
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          isVpn: data.security?.vpn || false,
          isProxy: data.security?.proxy || false,
          isTor: data.security?.tor || false,
          isHosting: isHosting || data.security?.hosting || false,
        };
      }
    }

    // Fallback: heuristiques basiques
    return {
      isVpn: false,
      isProxy: false,
      isTor: false,
      isHosting,
    };
  } catch (error) {
    console.error('[IpIntelligence] Failed to detect VPN/Proxy:', error);
    return { isVpn: false, isProxy: false, isTor: false, isHosting: false };
  }
}

/**
 * Vérifie si l'IP appartient à un provider de hosting
 */
async function isHostingProvider(ip: string): Promise<boolean> {
  // Ranges AWS, GCP, Azure, etc. (simplifiés)
  const hostingRanges = [
    /^3\./,        // AWS
    /^13\./,       // AWS
    /^18\./,       // AWS
    /^34\./,       // GCP
    /^35\./,       // GCP
    /^104\.154\./, // GCP
    /^20\./,       // Azure
    /^40\./,       // Azure
    /^104\.40\./,  // Azure
  ];

  return hostingRanges.some(range => range.test(ip));
}

// ==================== REPUTATION SCORING ====================

/**
 * Calculate un score de risque pour une IP (0-100)
 * Plus le score est élevé, plus l'IP est suspecte
 */
export function calculateRiskScore(analysis: Partial<IpAnalysis>, behavior?: IpBehavior): number {
  let score = 0;

  // VPN/Proxy/Tor (+30)
  if (analysis.isVpn) score += 30;
  if (analysis.isProxy) score += 30;
  if (analysis.isTor) score += 40;

  // Hosting provider (+15)
  if (analysis.isHosting) score += 15;

  // Comportement suspect
  if (behavior) {
    // Trop de requêtes (+20)
    if (behavior.requestCount > 1000) score += 20;
    else if (behavior.requestCount > 500) score += 10;

    // Trop d'endpoints différents (+15)
    if (behavior.uniqueEndpoints.size > 50) score += 15;
    else if (behavior.uniqueEndpoints.size > 20) score += 8;

    // Changement de User-Agent fréquent (+10)
    if (behavior.uniqueUserAgents.size > 5) score += 10;
    else if (behavior.uniqueUserAgents.size > 3) score += 5;

    // Changement de pays (+25)
    if (behavior.countries.size > 3) score += 25;
    else if (behavior.countries.size > 1) score += 10;

    // Patterns suspects (+30)
    if (behavior.suspiciousPatterns.length > 0) {
      score += Math.min(30, behavior.suspiciousPatterns.length * 10);
    }
  }

  return Math.min(100, score);
}

/**
 * Détermine la réputation selon le score
 */
export function getReputation(score: number): 'good' | 'suspicious' | 'bad' {
  if (score >= 70) return 'bad';
  if (score >= 40) return 'suspicious';
  return 'good';
}

// ==================== BEHAVIORAL ANALYSIS ====================

/**
 * Enregistre une requête pour analyse comportementale
 * Edge Runtime: retourne un comportement stateless (pas de cache)
 */
export function recordIpBehavior(
  ip: string,
  endpoint: string,
  userAgent: string,
  country?: string
): IpBehavior {
  // 🟢 EDGE → stateless, pas de cache
  if (isEdgeRuntime) {
    return {
      ip,
      requestCount: 1,
      uniqueEndpoints: new Set([endpoint]),
      uniqueUserAgents: new Set([userAgent]),
      countries: country ? new Set([country]) : new Set(),
      firstSeen: new Date(),
      lastSeen: new Date(),
      suspiciousPatterns: [],
    };
  }

  // 🟢 NODE.JS → cache comportemental complet
  let behavior = ipBehaviorCache.get(ip);

  if (!behavior) {
    behavior = {
      ip,
      requestCount: 0,
      uniqueEndpoints: new Set(),
      uniqueUserAgents: new Set(),
      countries: new Set(),
      firstSeen: new Date(),
      lastSeen: new Date(),
      suspiciousPatterns: [],
    };
    ipBehaviorCache.set(ip, behavior);
  }

  behavior.requestCount++;
  behavior.uniqueEndpoints.add(endpoint);
  behavior.uniqueUserAgents.add(userAgent);
  if (country) behavior.countries.add(country);
  behavior.lastSeen = new Date();

  // Détecter les patterns suspects
  detectSuspiciousPatterns(behavior);

  // Limiter la taille du cache
  if (ipBehaviorCache.size > MAX_CACHE_SIZE) {
    cleanupBehaviorCache();
  }

  return behavior;
}

/**
 * Détecte les patterns suspects dans le comportement
 */
function detectSuspiciousPatterns(behavior: IpBehavior): void {
  const patterns: string[] = [];

  // Trop de requêtes en peu de temps
  const timeDiff = behavior.lastSeen.getTime() - behavior.firstSeen.getTime();
  const requestsPerMinute = (behavior.requestCount / timeDiff) * 60 * 1000;
  if (requestsPerMinute > 100) {
    patterns.push('high_request_rate');
  }

  // Scan d'endpoints (trop d'endpoints différents)
  if (behavior.uniqueEndpoints.size > 30) {
    patterns.push('endpoint_scanning');
  }

  // User-Agent switching
  if (behavior.uniqueUserAgents.size > 5) {
    patterns.push('user_agent_switching');
  }

  // Geo-hopping
  if (behavior.countries.size > 2) {
    patterns.push('geo_hopping');
  }

  behavior.suspiciousPatterns = patterns;
}

/**
 * Nettoie le cache comportemental (supprime les anciennes entrées)
 */
function cleanupBehaviorCache(): void {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24h

  let deleted = 0;
  for (const [ip, behavior] of ipBehaviorCache.entries()) {
    if (now - behavior.lastSeen.getTime() > maxAge) {
      ipBehaviorCache.delete(ip);
      deleted++;
    }
  }

  console.log(`[IpIntelligence] Cleaned up ${deleted} old behavior entries`);

  // Si encore trop, supprimer les moins actifs
  if (ipBehaviorCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(ipBehaviorCache.entries())
      .sort((a, b) => a[1].requestCount - b[1].requestCount);

    const toDelete = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
    toDelete.forEach(([ip]) => ipBehaviorCache.delete(ip));
  }
}

// ==================== MAIN ANALYSIS ====================

/**
 * Analyse complète d'une IP
 */
export async function analyzeIp(ip: string, useCache = true): Promise<IpAnalysis> {
  // Vérifier le cache
  if (useCache) {
    const cached = ipAnalysisCache.get(ip);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  // Analyse complète
  const [location, vpnProxy] = await Promise.all([
    getIpLocation(ip),
    detectVpnProxy(ip),
  ]);

  const behavior = ipBehaviorCache.get(ip);
  const partialAnalysis = { ...vpnProxy };
  const riskScore = calculateRiskScore(partialAnalysis, behavior);
  const reputation = getReputation(riskScore);

  const analysis: IpAnalysis = {
    ip,
    location,
    ...vpnProxy,
    riskScore,
    reputation,
    lastSeen: new Date(),
  };

  // Mettre en cache
  ipAnalysisCache.set(ip, {
    data: analysis,
    expiresAt: Date.now() + CACHE_TTL,
  });

  // Limiter la taille du cache
  if (ipAnalysisCache.size > MAX_CACHE_SIZE) {
    const oldest = Array.from(ipAnalysisCache.entries())
      .sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
    if (oldest) {
      ipAnalysisCache.delete(oldest[0]);
    }
  }

  return analysis;
}

/**
 * Analyse une requête complète (IP + comportement)
 * Edge Runtime: analyse simplifiée, pas de blocage de localhost
 */
export async function analyzeRequest(request: NextRequest): Promise<{
  ip: string;
  analysis: IpAnalysis;
  behavior: IpBehavior;
  shouldBlock: boolean;
  blockReason?: string;
}> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';
  const endpoint = request.nextUrl.pathname;

  // 🟢 Ne jamais bloquer localhost en développement
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return {
      ip,
      analysis: {
        ip,
        location: null,
        isVpn: false,
        isProxy: false,
        isTor: false,
        isHosting: false,
        riskScore: 0,
        reputation: 'good',
        lastSeen: new Date(),
      },
      behavior: {
        ip,
        requestCount: 1,
        uniqueEndpoints: new Set([endpoint]),
        uniqueUserAgents: new Set([userAgent]),
        countries: new Set(),
        firstSeen: new Date(),
        lastSeen: new Date(),
        suspiciousPatterns: [],
      },
      shouldBlock: false,
    };
  }

  // 🟢 EDGE → analyse simplifiée sans cache
  if (isEdgeRuntime) {
    const behavior: IpBehavior = {
      ip,
      requestCount: 1,
      uniqueEndpoints: new Set([endpoint]),
      uniqueUserAgents: new Set([userAgent]),
      countries: new Set(),
      firstSeen: new Date(),
      lastSeen: new Date(),
      suspiciousPatterns: [],
    };

    const analysis: IpAnalysis = {
      ip,
      location: null,
      isVpn: false,
      isProxy: false,
      isTor: false,
      isHosting: false,
      riskScore: 0,
      reputation: 'good',
      lastSeen: new Date(),
    };

    return {
      ip,
      analysis,
      behavior,
      shouldBlock: false,
    };
  }

  // 🟢 NODE.JS → analyse complète
  // Analyse IP
  const analysis = await analyzeIp(ip);

  // Enregistrer le comportement
  const behavior = recordIpBehavior(ip, endpoint, userAgent, analysis.location?.country);

  // Recalculer le score avec le comportement
  analysis.riskScore = calculateRiskScore(analysis, behavior);
  analysis.reputation = getReputation(analysis.riskScore);

  // Décider si on bloque
  let shouldBlock = false;
  let blockReason: string | undefined;

  if (analysis.reputation === 'bad') {
    shouldBlock = true;
    blockReason = 'High risk IP detected';
  } else if (behavior.suspiciousPatterns.includes('high_request_rate')) {
    shouldBlock = true;
    blockReason = 'Suspicious request pattern detected';
  } else if (analysis.isTor) {
    shouldBlock = true;
    blockReason = 'Tor exit node detected';
  }

  return {
    ip,
    analysis,
    behavior,
    shouldBlock,
    blockReason,
  };
}

/**
 * Obtient les statistiques globales
 */
export function getIpIntelligenceStats(): {
  totalIps: number;
  cachedAnalysis: number;
  highRiskIps: number;
  vpnCount: number;
  torCount: number;
} {
  let highRiskIps = 0;
  let vpnCount = 0;
  let torCount = 0;

  for (const { data } of ipAnalysisCache.values()) {
    if (data.riskScore >= 70) highRiskIps++;
    if (data.isVpn) vpnCount++;
    if (data.isTor) torCount++;
  }

  return {
    totalIps: ipBehaviorCache.size,
    cachedAnalysis: ipAnalysisCache.size,
    highRiskIps,
    vpnCount,
    torCount,
  };
}

// Cleanup périodique
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupBehaviorCache();
  }, 60 * 60 * 1000); // Toutes les heures
}

