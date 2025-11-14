/**
 * Logging de sécurité centralisé
 * 
 * Enregistre tous les événements de sécurité pour audit et monitoring
 */

import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import type { NextRequest } from 'next/server';

// ==================== TYPES ====================

export type SecurityEventType =
  | 'rate_limit_exceeded'
  | 'app_check_failed'
  | 'auth_failed'
  | 'validation_failed'
  | 'sanitization_failed'
  | 'sql_injection_attempt'
  | 'xss_attempt'
  | 'unauthorized_access'
  | 'suspicious_activity'
  | 'data_breach_attempt'
  | 'invalid_token'
  | 'csrf_attempt';

export interface SecurityLog {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  ip: string;
  userAgent?: string;
  userId?: string;
  merchantId?: string;
  endpoint?: string;
  method?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// ==================== FONCTIONS DE LOGGING ====================

/**
 * Log un événement de sécurité dans Firestore
 */
export async function logSecurityEvent(
  event: Omit<SecurityLog, 'timestamp'>
): Promise<void> {
  try {
    const logEntry: SecurityLog = {
      ...event,
      timestamp: new Date(),
    };

    // Enregistrer dans Firestore
    await adminDb.collection('security_logs').add({
      ...logEntry,
      timestamp: Timestamp.fromDate(logEntry.timestamp),
    });

    // Aussi logger dans la console en développement
    if (process.env['NODE_ENV'] === 'development') {
      const emoji = getSeverityEmoji(event.severity);
      console.log(
        `${emoji} [SECURITY] ${event.type.toUpperCase()}: ${event.message}`,
        {
          ip: event.ip,
          endpoint: event.endpoint,
          severity: event.severity,
        }
      );
    }
  } catch (error) {
    // Ne pas faire échouer la requête si le logging échoue
    console.error('Failed to log security event:', error);
  }
}

/**
 * Helper pour obtenir l'emoji selon la sévérité
 */
function getSeverityEmoji(severity: SecurityLog['severity']): string {
  switch (severity) {
    case 'critical':
      return '🚨';
    case 'high':
      return '⚠️';
    case 'medium':
      return '🔶';
    case 'low':
      return 'ℹ️';
    default:
      return '📝';
  }
}

/**
 * Extrait les informations de la requête pour le logging
 */
export function extractRequestInfo(request: NextRequest): {
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
} {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';
  const endpoint = request.nextUrl.pathname;
  const method = request.method;

  return { ip, userAgent, endpoint, method };
}

// ==================== FONCTIONS SPÉCIALISÉES ====================

/**
 * Log un rate limit dépassé
 */
export async function logRateLimitExceeded(
  request: NextRequest,
  details?: { count: number; limit: number }
): Promise<void> {
  const { ip, userAgent, endpoint, method } = extractRequestInfo(request);

  await logSecurityEvent({
    type: 'rate_limit_exceeded',
    severity: 'medium',
    message: `Rate limit exceeded: ${details?.count || 'unknown'} requests`,
    ip,
    userAgent,
    endpoint,
    method,
    details,
  });
}

/**
 * Log un échec App Check
 */
export async function logAppCheckFailed(
  request: NextRequest,
  reason: string
): Promise<void> {
  const { ip, userAgent, endpoint, method } = extractRequestInfo(request);

  await logSecurityEvent({
    type: 'app_check_failed',
    severity: 'high',
    message: `App Check failed: ${reason}`,
    ip,
    userAgent,
    endpoint,
    method,
    details: { reason },
  });
}

/**
 * Log un échec d'authentification
 */
export async function logAuthFailed(
  request: NextRequest,
  reason: string,
  userId?: string
): Promise<void> {
  const { ip, userAgent, endpoint, method } = extractRequestInfo(request);

  await logSecurityEvent({
    type: 'auth_failed',
    severity: 'medium',
    message: `Authentication failed: ${reason}`,
    ip,
    userAgent,
    userId,
    endpoint,
    method,
    details: { reason },
  });
}

/**
 * Log une tentative d'injection SQL
 */
export async function logSqlInjectionAttempt(
  request: NextRequest,
  input: string,
  userId?: string
): Promise<void> {
  const { ip, userAgent, endpoint, method } = extractRequestInfo(request);

  await logSecurityEvent({
    type: 'sql_injection_attempt',
    severity: 'critical',
    message: 'SQL injection attempt detected',
    ip,
    userAgent,
    userId,
    endpoint,
    method,
    details: {
      input: input.substring(0, 200), // Limiter la taille
    },
  });
}

/**
 * Log une tentative XSS
 */
export async function logXssAttempt(
  request: NextRequest,
  input: string,
  userId?: string
): Promise<void> {
  const { ip, userAgent, endpoint, method } = extractRequestInfo(request);

  await logSecurityEvent({
    type: 'xss_attempt',
    severity: 'high',
    message: 'XSS attempt detected',
    ip,
    userAgent,
    userId,
    endpoint,
    method,
    details: {
      input: input.substring(0, 200), // Limiter la taille
    },
  });
}

/**
 * Log un accès non autorisé
 */
export async function logUnauthorizedAccess(
  request: NextRequest,
  reason: string,
  userId?: string,
  merchantId?: string
): Promise<void> {
  const { ip, userAgent, endpoint, method } = extractRequestInfo(request);

  await logSecurityEvent({
    type: 'unauthorized_access',
    severity: 'high',
    message: `Unauthorized access attempt: ${reason}`,
    ip,
    userAgent,
    userId,
    merchantId,
    endpoint,
    method,
    details: { reason },
  });
}

/**
 * Log une erreur de validation
 */
export async function logValidationFailed(
  request: NextRequest,
  errors: Array<{ path: string; message: string }>,
  userId?: string
): Promise<void> {
  const { ip, userAgent, endpoint, method } = extractRequestInfo(request);

  await logSecurityEvent({
    type: 'validation_failed',
    severity: 'low',
    message: 'Input validation failed',
    ip,
    userAgent,
    userId,
    endpoint,
    method,
    details: { errors },
  });
}

/**
 * Log une activité suspecte
 */
export async function logSuspiciousActivity(
  request: NextRequest,
  description: string,
  details?: Record<string, any>,
  userId?: string
): Promise<void> {
  const { ip, userAgent, endpoint, method } = extractRequestInfo(request);

  await logSecurityEvent({
    type: 'suspicious_activity',
    severity: 'medium',
    message: description,
    ip,
    userAgent,
    userId,
    endpoint,
    method,
    details,
  });
}

// ==================== QUERIES ====================

/**
 * Récupère les logs de sécurité récents
 */
export async function getRecentSecurityLogs(
  limit: number = 100,
  type?: SecurityEventType,
  severity?: SecurityLog['severity']
): Promise<SecurityLog[]> {
  try {
    let query = adminDb
      .collection('security_logs')
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (type) {
      query = query.where('type', '==', type) as any;
    }

    if (severity) {
      query = query.where('severity', '==', severity) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => {
      const data = doc.data() as SecurityLog & { timestamp: Timestamp };
      return {
        ...data,
        timestamp: data.timestamp.toDate(),
      };
    });
  } catch (error) {
    console.error('Failed to get security logs:', error);
    return [];
  }
}

/**
 * Compte les événements de sécurité par type
 */
export async function countSecurityEventsByType(
  hours: number = 24
): Promise<Record<SecurityEventType, number>> {
  try {
    const since = new Date();
    since.setHours(since.getHours() - hours);

    const snapshot = await adminDb
      .collection('security_logs')
      .where('timestamp', '>=', Timestamp.fromDate(since))
      .get();

    const counts: Record<string, number> = {};

    snapshot.docs.forEach(doc => {
      const data = doc.data() as Partial<SecurityLog>;
      const type = (data.type || 'suspicious_activity') as SecurityEventType;
      counts[type] = (counts[type] || 0) + 1;
    });

    return counts as Record<SecurityEventType, number>;
  } catch (error) {
    console.error('Failed to count security events:', error);
    return {} as Record<SecurityEventType, number>;
  }
}

export interface SecurityMetrics {
  total24h: number;
  total7d: number;
  countsByType: Record<SecurityEventType, number>;
  severityCounts: Record<SecurityLog['severity'], number>;
  topIps: Array<{ ip: string; count: number }>;
  topEndpoints: Array<{ endpoint: string; count: number }>;
  latestEvents: SecurityLog[];
}

export async function getSecurityMetrics(): Promise<SecurityMetrics> {
  const now = new Date();
  const since24 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [snapshot24, snapshot7, latestSnapshot] = await Promise.all([
    adminDb
      .collection('security_logs')
      .where('timestamp', '>=', Timestamp.fromDate(since24))
      .get(),
    adminDb
      .collection('security_logs')
      .where('timestamp', '>=', Timestamp.fromDate(since7d))
      .get(),
    adminDb
      .collection('security_logs')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get(),
  ]);

  const countsByType: Record<SecurityEventType, number> = {} as Record<SecurityEventType, number>;
  const severityCounts: Record<SecurityLog['severity'], number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };
  const ipCounts: Record<string, number> = {};
  const endpointCounts: Record<string, number> = {};

  snapshot24.docs.forEach(doc => {
    const data = doc.data() as Partial<SecurityLog>;
    const type = (data.type || 'suspicious_activity') as SecurityEventType;
    const severity = (data.severity || 'low') as SecurityLog['severity'];
    const ip = data.ip || 'unknown';
    const endpoint = data.endpoint || 'unknown';

    countsByType[type] = (countsByType[type] || 0) + 1;
    severityCounts[severity] = (severityCounts[severity] || 0) + 1;
    ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    endpointCounts[endpoint] = (endpointCounts[endpoint] || 0) + 1;
  });

  const topIps = Object.entries(ipCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ip, count]) => ({ ip, count }));

  const topEndpoints = Object.entries(endpointCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([endpoint, count]) => ({ endpoint, count }));

  const latestEvents: SecurityLog[] = latestSnapshot.docs.map(doc => {
    const data = doc.data() as SecurityLog & { timestamp: Timestamp };
    return {
      ...data,
      timestamp: data.timestamp.toDate(),
    };
  });

  return {
    total24h: snapshot24.size,
    total7d: snapshot7.size,
    countsByType,
    severityCounts,
    topIps,
    topEndpoints,
    latestEvents,
  };
}

