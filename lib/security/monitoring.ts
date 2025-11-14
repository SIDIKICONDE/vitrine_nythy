/**
 * Real-Time Security Monitoring & Alerting
 * 
 * Système de monitoring avec:
 * - Métriques en temps réel
 * - Alertes automatiques
 * - Dashboards de sécurité
 * - Intégration Slack/Email/Webhook
 */

import type { IpAnalysis } from './ip-intelligence';
import { logSecurityEvent } from './security-logger-edge';

// ==================== TYPES ====================

export interface SecurityMetrics {
  timestamp: number;
  requests: {
    total: number;
    blocked: number;
    rateLimit: number;
    csrfFailed: number;
    anomalies: number;
  };
  threats: {
    sqlInjection: number;
    xss: number;
    bruteForce: number;
    scanning: number;
  };
  ips: {
    unique: number;
    blocked: number;
    highRisk: number;
    vpn: number;
    tor: number;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    errorRate: number;
  };
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  title: string;
  message: string;
  details: Record<string, any>;
  acknowledged: boolean;
  resolvedAt?: number;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: (metrics: SecurityMetrics) => boolean;
  cooldown: number; // ms entre deux alertes
  channels: AlertChannel[];
}

export type AlertChannel = 'console' | 'email' | 'slack' | 'webhook' | 'firestore';

// ==================== STORAGE ====================

const metricsHistory: SecurityMetrics[] = [];
const activeAlerts = new Map<string, Alert>();
const alertCooldowns = new Map<string, number>();
const MAX_HISTORY = 1000;

let currentMetrics: SecurityMetrics = {
  timestamp: Date.now(),
  requests: {
    total: 0,
    blocked: 0,
    rateLimit: 0,
    csrfFailed: 0,
    anomalies: 0,
  },
  threats: {
    sqlInjection: 0,
    xss: 0,
    bruteForce: 0,
    scanning: 0,
  },
  ips: {
    unique: 0,
    blocked: 0,
    highRisk: 0,
    vpn: 0,
    tor: 0,
  },
  performance: {
    avgResponseTime: 0,
    p95ResponseTime: 0,
    errorRate: 0,
  },
};

// ==================== ALERT RULES ====================

const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'high_block_rate',
    name: 'High Block Rate',
    description: 'More than 20% of requests are being blocked',
    severity: 'high',
    condition: (metrics) => {
      const blockRate = metrics.requests.total > 0
        ? (metrics.requests.blocked / metrics.requests.total) * 100
        : 0;
      return blockRate > 20;
    },
    cooldown: 5 * 60 * 1000, // 5 minutes
    channels: ['console', 'firestore', 'slack'],
  },
  {
    id: 'sql_injection_attack',
    name: 'SQL Injection Attack',
    description: 'Multiple SQL injection attempts detected',
    severity: 'critical',
    condition: (metrics) => metrics.threats.sqlInjection > 5,
    cooldown: 2 * 60 * 1000, // 2 minutes
    channels: ['console', 'firestore', 'slack', 'email'],
  },
  {
    id: 'xss_attack',
    name: 'XSS Attack',
    description: 'Multiple XSS attempts detected',
    severity: 'critical',
    condition: (metrics) => metrics.threats.xss > 5,
    cooldown: 2 * 60 * 1000,
    channels: ['console', 'firestore', 'slack', 'email'],
  },
  {
    id: 'brute_force_attack',
    name: 'Brute Force Attack',
    description: 'Multiple authentication failures detected',
    severity: 'high',
    condition: (metrics) => metrics.threats.bruteForce > 10,
    cooldown: 3 * 60 * 1000,
    channels: ['console', 'firestore', 'slack'],
  },
  {
    id: 'port_scanning',
    name: 'Port/Endpoint Scanning',
    description: 'Scanning activity detected',
    severity: 'medium',
    condition: (metrics) => metrics.threats.scanning > 3,
    cooldown: 10 * 60 * 1000,
    channels: ['console', 'firestore'],
  },
  {
    id: 'high_risk_ips',
    name: 'High Risk IPs',
    description: 'Multiple high-risk IPs detected',
    severity: 'high',
    condition: (metrics) => metrics.ips.highRisk > 10,
    cooldown: 10 * 60 * 1000,
    channels: ['console', 'firestore'],
  },
  {
    id: 'tor_activity',
    name: 'Tor Network Activity',
    description: 'Tor exit nodes detected',
    severity: 'medium',
    condition: (metrics) => metrics.ips.tor > 3,
    cooldown: 15 * 60 * 1000,
    channels: ['console', 'firestore'],
  },
  {
    id: 'high_error_rate',
    name: 'High Error Rate',
    description: 'Error rate exceeds 10%',
    severity: 'medium',
    condition: (metrics) => metrics.performance.errorRate > 10,
    cooldown: 5 * 60 * 1000,
    channels: ['console', 'firestore'],
  },
  {
    id: 'rate_limit_spike',
    name: 'Rate Limit Spike',
    description: 'Unusual number of rate-limited requests',
    severity: 'medium',
    condition: (metrics) => metrics.requests.rateLimit > 50,
    cooldown: 5 * 60 * 1000,
    channels: ['console', 'firestore'],
  },
];

// ==================== METRICS COLLECTION ====================

/**
 * Enregistre une requête dans les métriques
 */
export function recordMetric(
  type: 'request' | 'block' | 'rateLimit' | 'csrfFailed' | 'anomaly' | 'threat',
  subtype?: string
): void {
  currentMetrics.requests.total++;

  switch (type) {
    case 'block':
      currentMetrics.requests.blocked++;
      break;
    case 'rateLimit':
      currentMetrics.requests.rateLimit++;
      break;
    case 'csrfFailed':
      currentMetrics.requests.csrfFailed++;
      break;
    case 'anomaly':
      currentMetrics.requests.anomalies++;
      break;
    case 'threat':
      if (subtype === 'sql_injection') currentMetrics.threats.sqlInjection++;
      else if (subtype === 'xss') currentMetrics.threats.xss++;
      else if (subtype === 'brute_force') currentMetrics.threats.bruteForce++;
      else if (subtype === 'scanning') currentMetrics.threats.scanning++;
      break;
  }
}

/**
 * Met à jour les métriques IP
 */
export function updateIpMetrics(analysis: IpAnalysis): void {
  if (analysis.riskScore >= 70) {
    currentMetrics.ips.highRisk++;
  }
  if (analysis.isVpn) {
    currentMetrics.ips.vpn++;
  }
  if (analysis.isTor) {
    currentMetrics.ips.tor++;
  }
}

/**
 * Enregistre le temps de réponse
 */
export function recordResponseTime(ms: number, statusCode: number): void {
  // Simplification: on garde juste la moyenne
  const count = currentMetrics.requests.total;
  const currentAvg = currentMetrics.performance.avgResponseTime;
  currentMetrics.performance.avgResponseTime =
    (currentAvg * (count - 1) + ms) / count;

  // Taux d'erreur
  if (statusCode >= 400) {
    const errorCount = Math.round(currentMetrics.performance.errorRate * count / 100);
    currentMetrics.performance.errorRate = ((errorCount + 1) / count) * 100;
  }
}

/**
 * Snapshot des métriques actuelles
 */
export function snapshotMetrics(): void {
  const snapshot = JSON.parse(JSON.stringify(currentMetrics));
  snapshot.timestamp = Date.now();

  metricsHistory.push(snapshot);

  // Limiter l'historique
  if (metricsHistory.length > MAX_HISTORY) {
    metricsHistory.shift();
  }

  // Vérifier les règles d'alerte
  checkAlertRules(snapshot);

  // Reset des compteurs (garder les totaux cumulatifs)
  currentMetrics.timestamp = Date.now();
}

/**
 * Obtient les métriques actuelles
 */
export function getCurrentMetrics(): SecurityMetrics {
  return { ...currentMetrics };
}

/**
 * Obtient l'historique des métriques
 */
export function getMetricsHistory(limit?: number): SecurityMetrics[] {
  const history = [...metricsHistory];
  if (limit) {
    return history.slice(-limit);
  }
  return history;
}

// ==================== ALERTING ====================

/**
 * Crée une alerte
 */
function createAlert(rule: AlertRule, metrics: SecurityMetrics): Alert {
  return {
    id: `${rule.id}-${Date.now()}`,
    timestamp: Date.now(),
    severity: rule.severity,
    type: rule.id,
    title: rule.name,
    message: rule.description,
    details: { metrics },
    acknowledged: false,
  };
}

/**
 * Vérifie les règles d'alerte
 */
async function checkAlertRules(metrics: SecurityMetrics): Promise<void> {
  const now = Date.now();

  for (const rule of DEFAULT_ALERT_RULES) {
    // Vérifier le cooldown
    const lastAlert = alertCooldowns.get(rule.id);
    if (lastAlert && now - lastAlert < rule.cooldown) {
      continue;
    }

    // Vérifier la condition
    try {
      if (rule.condition(metrics)) {
        const alert = createAlert(rule, metrics);
        activeAlerts.set(alert.id, alert);
        alertCooldowns.set(rule.id, now);

        // Envoyer l'alerte
        await sendAlert(alert, rule.channels);
      }
    } catch (error) {
      console.error(`[Monitoring] Error checking rule ${rule.id}:`, error);
    }
  }
}

/**
 * Envoie une alerte sur les canaux configurés
 */
async function sendAlert(alert: Alert, channels: AlertChannel[]): Promise<void> {
  const promises = channels.map(async (channel) => {
    try {
      switch (channel) {
        case 'console':
          await sendConsoleAlert(alert);
          break;
        case 'firestore':
          await sendFirestoreAlert(alert);
          break;
        case 'slack':
          await sendSlackAlert(alert);
          break;
        case 'email':
          await sendEmailAlert(alert);
          break;
        case 'webhook':
          await sendWebhookAlert(alert);
          break;
      }
    } catch (error) {
      console.error(`[Monitoring] Failed to send alert to ${channel}:`, error);
    }
  });

  await Promise.allSettled(promises);
}

/**
 * Alerte console
 */
async function sendConsoleAlert(alert: Alert): Promise<void> {
  const emoji = {
    low: 'ℹ️',
    medium: '🔶',
    high: '⚠️',
    critical: '🚨',
  }[alert.severity];

  console.log(`\n${emoji} [SECURITY ALERT] ${alert.title}`);
  console.log(`Severity: ${alert.severity.toUpperCase()}`);
  console.log(`Message: ${alert.message}`);
  console.log(`Time: ${new Date(alert.timestamp).toISOString()}`);
  console.log('Details:', JSON.stringify(alert.details, null, 2));
  console.log('');
}

/**
 * Alerte Firestore
 */
async function sendFirestoreAlert(alert: Alert): Promise<void> {
  await logSecurityEvent({
    type: 'suspicious_activity',
    severity: alert.severity,
    message: `ALERT: ${alert.title} - ${alert.message}`,
    ip: 'system',
    details: alert.details,
  });
}

/**
 * Alerte Slack
 */
async function sendSlackAlert(alert: Alert): Promise<void> {
  const webhookUrl = process.env['SLACK_WEBHOOK_URL'];
  if (!webhookUrl) return;

  const color = {
    low: '#36a64f',
    medium: '#ff9900',
    high: '#ff6600',
    critical: '#ff0000',
  }[alert.severity];

  const payload = {
    attachments: [
      {
        color,
        title: `🚨 ${alert.title}`,
        text: alert.message,
        fields: [
          {
            title: 'Severity',
            value: alert.severity.toUpperCase(),
            short: true,
          },
          {
            title: 'Time',
            value: new Date(alert.timestamp).toISOString(),
            short: true,
          },
        ],
        footer: 'Nythy Security Monitoring',
        ts: Math.floor(alert.timestamp / 1000),
      },
    ],
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/**
 * Alerte Email
 */
async function sendEmailAlert(alert: Alert): Promise<void> {
  // TODO: Implémenter avec SendGrid, AWS SES, etc.
  console.log('[Monitoring] Email alert not implemented:', alert.title);
}

/**
 * Alerte Webhook
 */
async function sendWebhookAlert(alert: Alert): Promise<void> {
  const webhookUrl = process.env['SECURITY_WEBHOOK_URL'];
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert),
  });
}

/**
 * Obtient les alertes actives
 */
export function getActiveAlerts(): Alert[] {
  return Array.from(activeAlerts.values())
    .filter(alert => !alert.resolvedAt)
    .sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Acknowledge une alerte
 */
export function acknowledgeAlert(alertId: string): boolean {
  const alert = activeAlerts.get(alertId);
  if (alert) {
    alert.acknowledged = true;
    return true;
  }
  return false;
}

/**
 * Résout une alerte
 */
export function resolveAlert(alertId: string): boolean {
  const alert = activeAlerts.get(alertId);
  if (alert) {
    alert.resolvedAt = Date.now();
    return true;
  }
  return false;
}

// ==================== DASHBOARD DATA ====================

export interface SecurityDashboard {
  summary: {
    totalRequests: number;
    blockedRequests: number;
    blockRate: number;
    uniqueIps: number;
    highRiskIps: number;
    activeAlerts: number;
  };
  charts: {
    requestsOverTime: Array<{ timestamp: number; total: number; blocked: number }>;
    threatsOverTime: Array<{ timestamp: number; sqlInjection: number; xss: number; bruteForce: number }>;
    topBlockedIps: Array<{ ip: string; count: number }>;
  };
  recentAlerts: Alert[];
  metrics: SecurityMetrics;
}

/**
 * Génère les données pour le dashboard
 */
export function generateDashboardData(): SecurityDashboard {
  const metrics = getCurrentMetrics();
  const history = getMetricsHistory(60); // Dernière heure
  const alerts = getActiveAlerts();

  const blockRate = metrics.requests.total > 0
    ? (metrics.requests.blocked / metrics.requests.total) * 100
    : 0;

  return {
    summary: {
      totalRequests: metrics.requests.total,
      blockedRequests: metrics.requests.blocked,
      blockRate: Math.round(blockRate * 100) / 100,
      uniqueIps: metrics.ips.unique,
      highRiskIps: metrics.ips.highRisk,
      activeAlerts: alerts.length,
    },
    charts: {
      requestsOverTime: history.map(m => ({
        timestamp: m.timestamp,
        total: m.requests.total,
        blocked: m.requests.blocked,
      })),
      threatsOverTime: history.map(m => ({
        timestamp: m.timestamp,
        sqlInjection: m.threats.sqlInjection,
        xss: m.threats.xss,
        bruteForce: m.threats.bruteForce,
      })),
      topBlockedIps: [], // TODO: implémenter
    },
    recentAlerts: alerts.slice(0, 10),
    metrics,
  };
}

// ==================== HEALTH CHECK ====================

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message?: string;
  }[];
  timestamp: number;
}

/**
 * Vérifie la santé du système de sécurité
 */
export function checkSecurityHealth(): HealthStatus {
  const metrics = getCurrentMetrics();
  const checks: HealthStatus['checks'] = [];

  // Vérifier le taux de blocage
  const blockRate = metrics.requests.total > 0
    ? (metrics.requests.blocked / metrics.requests.total) * 100
    : 0;

  if (blockRate > 50) {
    checks.push({
      name: 'block_rate',
      status: 'fail',
      message: `Block rate too high: ${blockRate.toFixed(1)}%`,
    });
  } else if (blockRate > 20) {
    checks.push({
      name: 'block_rate',
      status: 'warn',
      message: `Block rate elevated: ${blockRate.toFixed(1)}%`,
    });
  } else {
    checks.push({
      name: 'block_rate',
      status: 'pass',
    });
  }

  // Vérifier le taux d'erreur
  if (metrics.performance.errorRate > 20) {
    checks.push({
      name: 'error_rate',
      status: 'fail',
      message: `Error rate too high: ${metrics.performance.errorRate.toFixed(1)}%`,
    });
  } else if (metrics.performance.errorRate > 10) {
    checks.push({
      name: 'error_rate',
      status: 'warn',
      message: `Error rate elevated: ${metrics.performance.errorRate.toFixed(1)}%`,
    });
  } else {
    checks.push({
      name: 'error_rate',
      status: 'pass',
    });
  }

  // Vérifier les alertes actives
  const activeAlertsCount = getActiveAlerts().length;
  if (activeAlertsCount > 10) {
    checks.push({
      name: 'active_alerts',
      status: 'fail',
      message: `Too many active alerts: ${activeAlertsCount}`,
    });
  } else if (activeAlertsCount > 5) {
    checks.push({
      name: 'active_alerts',
      status: 'warn',
      message: `Multiple active alerts: ${activeAlertsCount}`,
    });
  } else {
    checks.push({
      name: 'active_alerts',
      status: 'pass',
    });
  }

  // Déterminer le statut global
  const hasFailures = checks.some(c => c.status === 'fail');
  const hasWarnings = checks.some(c => c.status === 'warn');

  const status: HealthStatus['status'] = hasFailures
    ? 'unhealthy'
    : hasWarnings
      ? 'degraded'
      : 'healthy';

  return {
    status,
    checks,
    timestamp: Date.now(),
  };
}

// ==================== PERIODIC TASKS ====================

// Snapshot des métriques toutes les minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    snapshotMetrics();
  }, 60 * 1000);
}

