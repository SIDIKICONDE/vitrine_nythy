/**
 * Anomaly Detection & Auto-Blocking
 * 
 * Système de détection d'anomalies en temps réel avec:
 * - Machine Learning basique (z-score, moving averages)
 * - Détection de patterns d'attaque
 * - Auto-blocking progressif
 * - Alertes en temps réel
 */

import type { NextRequest } from 'next/server';
import { blacklistIp } from './rate-limiter-distributed';
import { logSecurityEvent } from './security-logger-edge';

// ==================== TYPES ====================

export interface AnomalyScore {
  overall: number; // 0-100
  components: {
    requestRate: number;
    errorRate: number;
    endpointDiversity: number;
    userAgentVariation: number;
    geographicAnomaly: number;
  };
  anomalies: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TimeSeriesData {
  timestamp: number;
  value: number;
}

export interface IpMetrics {
  ip: string;
  requestTimestamps: number[];
  errorCount: number;
  successCount: number;
  endpoints: Map<string, number>;
  userAgents: Set<string>;
  countries: Set<string>;
  methods: Map<string, number>;
  statusCodes: Map<number, number>;
  firstSeen: number;
  lastSeen: number;
  blockedUntil?: number;
  blockCount: number;
}

export interface AttackPattern {
  name: string;
  description: string;
  indicators: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoBlock: boolean;
}

// ==================== CONFIGURATION ====================

const METRICS_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_METRICS_ENTRIES = 50000;
const Z_SCORE_THRESHOLD = 3; // 3 écarts-types = anomalie

// Patterns d'attaque connus
const ATTACK_PATTERNS: AttackPattern[] = [
  {
    name: 'SQL Injection Scan',
    description: 'Multiple SQL injection attempts detected',
    indicators: ['sql_injection_attempt'],
    severity: 'critical',
    autoBlock: true,
  },
  {
    name: 'XSS Attack',
    description: 'Cross-site scripting attempts detected',
    indicators: ['xss_attempt'],
    severity: 'high',
    autoBlock: true,
  },
  {
    name: 'Brute Force',
    description: 'Repeated authentication failures',
    indicators: ['auth_failed'],
    severity: 'high',
    autoBlock: true,
  },
  {
    name: 'Directory Traversal',
    description: 'Attempting to access unauthorized paths',
    indicators: ['path_traversal'],
    severity: 'high',
    autoBlock: true,
  },
  {
    name: 'API Abuse',
    description: 'Excessive API calls in short time',
    indicators: ['rate_limit_exceeded'],
    severity: 'medium',
    autoBlock: false,
  },
  {
    name: 'Credential Stuffing',
    description: 'Multiple login attempts with different credentials',
    indicators: ['multiple_login_attempts'],
    severity: 'critical',
    autoBlock: true,
  },
  {
    name: 'Bot Activity',
    description: 'Automated bot behavior detected',
    indicators: ['bot_pattern', 'user_agent_switching'],
    severity: 'medium',
    autoBlock: false,
  },
];

// ==================== STORAGE ====================

const ipMetricsStore = new Map<string, IpMetrics>();
const globalMetrics: {
  requestTimestamps: number[];
  errorTimestamps: number[];
} = {
  requestTimestamps: [],
  errorTimestamps: [],
};

// ==================== METRICS COLLECTION ====================

/**
 * Enregistre une requête pour analyse
 */
export function recordRequest(
  ip: string,
  request: NextRequest,
  statusCode: number,
  country?: string
): void {
  const now = Date.now();
  const endpoint = request.nextUrl.pathname;
  const method = request.method;
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Métriques IP
  let metrics = ipMetricsStore.get(ip);
  if (!metrics) {
    metrics = {
      ip,
      requestTimestamps: [],
      errorCount: 0,
      successCount: 0,
      endpoints: new Map(),
      userAgents: new Set(),
      countries: new Set(),
      methods: new Map(),
      statusCodes: new Map(),
      firstSeen: now,
      lastSeen: now,
      blockCount: 0,
    };
    ipMetricsStore.set(ip, metrics);
  }

  // Nettoyer les anciennes timestamps (garder seulement la fenêtre)
  const windowStart = now - METRICS_WINDOW_MS;
  metrics.requestTimestamps = metrics.requestTimestamps.filter(ts => ts > windowStart);
  metrics.requestTimestamps.push(now);

  // Mettre à jour les compteurs
  if (statusCode >= 400) {
    metrics.errorCount++;
  } else {
    metrics.successCount++;
  }

  metrics.endpoints.set(endpoint, (metrics.endpoints.get(endpoint) || 0) + 1);
  metrics.userAgents.add(userAgent);
  if (country) metrics.countries.add(country);
  metrics.methods.set(method, (metrics.methods.get(method) || 0) + 1);
  metrics.statusCodes.set(statusCode, (metrics.statusCodes.get(statusCode) || 0) + 1);
  metrics.lastSeen = now;

  // Métriques globales
  globalMetrics.requestTimestamps = globalMetrics.requestTimestamps.filter(ts => ts > windowStart);
  globalMetrics.requestTimestamps.push(now);

  if (statusCode >= 400) {
    globalMetrics.errorTimestamps = globalMetrics.errorTimestamps.filter(ts => ts > windowStart);
    globalMetrics.errorTimestamps.push(now);
  }

  // Limiter la taille du store
  if (ipMetricsStore.size > MAX_METRICS_ENTRIES) {
    cleanupMetricsStore();
  }
}

/**
 * Nettoie le store de métriques
 */
function cleanupMetricsStore(): void {
  const now = Date.now();
  const maxAge = 60 * 60 * 1000; // 1 heure

  let deleted = 0;
  for (const [ip, metrics] of ipMetricsStore.entries()) {
    if (now - metrics.lastSeen > maxAge) {
      ipMetricsStore.delete(ip);
      deleted++;
    }
  }

  console.log(`[AnomalyDetection] Cleaned up ${deleted} old metric entries`);

  // Si encore trop, supprimer les moins actifs
  if (ipMetricsStore.size > MAX_METRICS_ENTRIES) {
    const entries = Array.from(ipMetricsStore.entries())
      .sort((a, b) => a[1].requestTimestamps.length - b[1].requestTimestamps.length);
    
    const toDelete = entries.slice(0, Math.floor(MAX_METRICS_ENTRIES * 0.2));
    toDelete.forEach(([ip]) => ipMetricsStore.delete(ip));
  }
}

// ==================== STATISTICAL ANALYSIS ====================

/**
 * Calcule la moyenne d'un tableau de nombres
 */
function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calcule l'écart-type
 */
function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = mean(values);
  const squareDiffs = values.map(val => Math.pow(val - avg, 2));
  return Math.sqrt(mean(squareDiffs));
}

/**
 * Calcule le z-score (nombre d'écarts-types par rapport à la moyenne)
 */
function zScore(value: number, values: number[]): number {
  const avg = mean(values);
  const std = standardDeviation(values);
  if (std === 0) return 0;
  return Math.abs((value - avg) / std);
}

/**
 * Calcule le taux de requêtes par minute
 */
function calculateRequestRate(timestamps: number[]): number {
  if (timestamps.length === 0) return 0;
  const now = Date.now();
  const windowStart = now - 60 * 1000; // 1 minute
  const recentRequests = timestamps.filter(ts => ts > windowStart);
  return recentRequests.length;
}

// ==================== ANOMALY DETECTION ====================

/**
 * Détecte les anomalies pour une IP
 */
export function detectAnomalies(ip: string): AnomalyScore {
  const metrics = ipMetricsStore.get(ip);
  if (!metrics) {
    return {
      overall: 0,
      components: {
        requestRate: 0,
        errorRate: 0,
        endpointDiversity: 0,
        userAgentVariation: 0,
        geographicAnomaly: 0,
      },
      anomalies: [],
      severity: 'low',
    };
  }

  const anomalies: string[] = [];
  const components = {
    requestRate: 0,
    errorRate: 0,
    endpointDiversity: 0,
    userAgentVariation: 0,
    geographicAnomaly: 0,
  };

  // 1. Taux de requêtes anormal
  const ipRequestRate = calculateRequestRate(metrics.requestTimestamps);
  const allRates = Array.from(ipMetricsStore.values())
    .map(m => calculateRequestRate(m.requestTimestamps))
    .filter(rate => rate > 0);
  
  if (allRates.length > 10) {
    const rateZScore = zScore(ipRequestRate, allRates);
    if (rateZScore > Z_SCORE_THRESHOLD) {
      components.requestRate = Math.min(100, rateZScore * 20);
      anomalies.push(`Abnormal request rate: ${ipRequestRate} req/min (z-score: ${rateZScore.toFixed(2)})`);
    }
  } else if (ipRequestRate > 100) {
    // Fallback si pas assez de données
    components.requestRate = Math.min(100, ipRequestRate / 2);
    anomalies.push(`High request rate: ${ipRequestRate} req/min`);
  }

  // 2. Taux d'erreur anormal
  const totalRequests = metrics.errorCount + metrics.successCount;
  if (totalRequests > 10) {
    const errorRate = (metrics.errorCount / totalRequests) * 100;
    if (errorRate > 50) {
      components.errorRate = errorRate;
      anomalies.push(`High error rate: ${errorRate.toFixed(1)}%`);
    }
  }

  // 3. Diversité d'endpoints (scanning)
  const uniqueEndpoints = metrics.endpoints.size;
  if (uniqueEndpoints > 20) {
    components.endpointDiversity = Math.min(100, uniqueEndpoints * 2);
    anomalies.push(`Endpoint scanning detected: ${uniqueEndpoints} unique endpoints`);
  }

  // 4. Variation de User-Agent (bot sophistiqué)
  const uniqueUserAgents = metrics.userAgents.size;
  if (uniqueUserAgents > 5) {
    components.userAgentVariation = Math.min(100, uniqueUserAgents * 10);
    anomalies.push(`User-Agent switching detected: ${uniqueUserAgents} different agents`);
  }

  // 5. Anomalie géographique (geo-hopping)
  const uniqueCountries = metrics.countries.size;
  if (uniqueCountries > 2) {
    components.geographicAnomaly = Math.min(100, uniqueCountries * 20);
    anomalies.push(`Geographic anomaly: ${uniqueCountries} different countries`);
  }

  // Score global (moyenne pondérée)
  const overall = Math.round(
    components.requestRate * 0.3 +
    components.errorRate * 0.2 +
    components.endpointDiversity * 0.2 +
    components.userAgentVariation * 0.15 +
    components.geographicAnomaly * 0.15
  );

  // Déterminer la sévérité
  let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (overall >= 80) severity = 'critical';
  else if (overall >= 60) severity = 'high';
  else if (overall >= 40) severity = 'medium';

  return {
    overall,
    components,
    anomalies,
    severity,
  };
}

/**
 * Détecte les patterns d'attaque connus
 */
export function detectAttackPatterns(ip: string, securityEvents: string[]): AttackPattern[] {
  const detectedPatterns: AttackPattern[] = [];

  for (const pattern of ATTACK_PATTERNS) {
    const matches = pattern.indicators.filter(indicator =>
      securityEvents.includes(indicator)
    );

    if (matches.length > 0) {
      detectedPatterns.push(pattern);
    }
  }

  return detectedPatterns;
}

// ==================== AUTO-BLOCKING ====================

/**
 * Décide si une IP doit être bloquée automatiquement
 */
export async function shouldAutoBlock(
  ip: string,
  anomalyScore: AnomalyScore,
  attackPatterns: AttackPattern[]
): Promise<{
  shouldBlock: boolean;
  reason?: string;
  duration?: number;
}> {
  const metrics = ipMetricsStore.get(ip);
  if (!metrics) {
    return { shouldBlock: false };
  }

  // Déjà bloquée ?
  if (metrics.blockedUntil && Date.now() < metrics.blockedUntil) {
    return { shouldBlock: true, reason: 'Already blocked' };
  }

  // Pattern d'attaque critique avec auto-block
  const criticalPattern = attackPatterns.find(
    p => p.autoBlock && (p.severity === 'critical' || p.severity === 'high')
  );
  if (criticalPattern) {
    return {
      shouldBlock: true,
      reason: `Attack pattern detected: ${criticalPattern.name}`,
      duration: 24 * 60 * 60 * 1000, // 24h
    };
  }

  // Score d'anomalie critique
  if (anomalyScore.overall >= 80) {
    return {
      shouldBlock: true,
      reason: `Critical anomaly score: ${anomalyScore.overall}`,
      duration: 12 * 60 * 60 * 1000, // 12h
    };
  }

  // Score d'anomalie élevé avec historique de blocks
  if (anomalyScore.overall >= 60 && metrics.blockCount > 2) {
    return {
      shouldBlock: true,
      reason: `Repeated offender: ${anomalyScore.overall} score, ${metrics.blockCount} previous blocks`,
      duration: 48 * 60 * 60 * 1000, // 48h
    };
  }

  return { shouldBlock: false };
}

/**
 * Bloque une IP automatiquement
 */
export async function autoBlockIp(
  ip: string,
  reason: string,
  duration: number,
  request?: NextRequest
): Promise<void> {
  const metrics = ipMetricsStore.get(ip);
  if (metrics) {
    metrics.blockedUntil = Date.now() + duration;
    metrics.blockCount++;
  }

  // Blacklist dans le rate limiter
  await blacklistIp(ip, duration);

  // Log l'événement
  if (request) {
    await logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'critical',
      message: `Auto-blocked IP: ${reason}`,
      ip,
      userAgent: request.headers.get('user-agent') || undefined,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      details: {
        reason,
        duration: `${Math.round(duration / 1000 / 60)} minutes`,
        blockCount: metrics?.blockCount || 1,
      },
    });
  }

  console.log(`[AnomalyDetection] 🚫 Auto-blocked IP ${ip}: ${reason} (${Math.round(duration / 1000 / 60)}min)`);
}

/**
 * Analyse complète et auto-blocking si nécessaire
 */
export async function analyzeAndBlock(
  ip: string,
  request: NextRequest,
  securityEvents: string[] = []
): Promise<{
  blocked: boolean;
  anomalyScore: AnomalyScore;
  attackPatterns: AttackPattern[];
  reason?: string;
}> {
  // Détecter les anomalies
  const anomalyScore = detectAnomalies(ip);

  // Détecter les patterns d'attaque
  const attackPatterns = detectAttackPatterns(ip, securityEvents);

  // Décider du blocage
  const blockDecision = await shouldAutoBlock(ip, anomalyScore, attackPatterns);

  if (blockDecision.shouldBlock && blockDecision.reason && blockDecision.duration) {
    await autoBlockIp(ip, blockDecision.reason, blockDecision.duration, request);
    return {
      blocked: true,
      anomalyScore,
      attackPatterns,
      reason: blockDecision.reason,
    };
  }

  return {
    blocked: false,
    anomalyScore,
    attackPatterns,
  };
}

// ==================== STATS & MONITORING ====================

/**
 * Obtient les statistiques de détection d'anomalies
 */
export function getAnomalyStats(): {
  totalIps: number;
  blockedIps: number;
  highRiskIps: number;
  averageAnomalyScore: number;
  topAnomalies: Array<{ ip: string; score: number; anomalies: string[] }>;
} {
  const now = Date.now();
  let blockedCount = 0;
  let highRiskCount = 0;
  const scores: number[] = [];
  const anomalyList: Array<{ ip: string; score: number; anomalies: string[] }> = [];

  for (const [ip, metrics] of ipMetricsStore.entries()) {
    if (metrics.blockedUntil && now < metrics.blockedUntil) {
      blockedCount++;
    }

    const anomalyScore = detectAnomalies(ip);
    scores.push(anomalyScore.overall);

    if (anomalyScore.overall >= 60) {
      highRiskCount++;
      anomalyList.push({
        ip,
        score: anomalyScore.overall,
        anomalies: anomalyScore.anomalies,
      });
    }
  }

  anomalyList.sort((a, b) => b.score - a.score);

  return {
    totalIps: ipMetricsStore.size,
    blockedIps: blockedCount,
    highRiskIps: highRiskCount,
    averageAnomalyScore: scores.length > 0 ? Math.round(mean(scores)) : 0,
    topAnomalies: anomalyList.slice(0, 10),
  };
}

// Cleanup périodique
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanupMetricsStore();
  }, 15 * 60 * 1000); // Toutes les 15 minutes
}

