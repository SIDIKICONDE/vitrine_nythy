/**
 * Edge-compatible security logger.
 *
 * This module avoids Node.js-only APIs so it can run inside the Next.js
 * middleware (Edge Runtime). Events are logged to the console and can
 * optionally be forwarded to a webhook (if one is provided at runtime via
 * the global scope).
 */

import type { NextRequest } from 'next/server';

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

type WebhookPayload = Omit<SecurityLog, 'timestamp'> & {
  timestamp: string;
};

/**
 * Retrieve an optional webhook URL exposed via global scope. Using globalThis
 * keeps us compatible with the Edge runtime where process.env is unavailable.
 */
function getEdgeWebhookUrl(): string | undefined {
  const globalAny = globalThis as Record<string, unknown>;
  const fromGlobal = globalAny['EDGE_SECURITY_WEBHOOK_URL'];
  if (typeof fromGlobal === 'string' && fromGlobal.length > 0) {
    return fromGlobal;
  }
  return undefined;
}

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

function summarizeEvent(event: Omit<SecurityLog, 'timestamp'>): Record<string, unknown> {
  const summary: Record<string, unknown> = {
    type: event.type,
    severity: event.severity,
    message: event.message,
    ip: event.ip,
  };

  if (event.endpoint) summary.endpoint = event.endpoint;
  if (event.method) summary.method = event.method;
  if (event.userAgent) summary.userAgent = event.userAgent;
  if (event.userId) summary.userId = event.userId;
  if (event.merchantId) summary.merchantId = event.merchantId;
  if (event.details) summary.details = event.details;

  return summary;
}

async function postToWebhook(logEntry: SecurityLog): Promise<void> {
  const webhookUrl = getEdgeWebhookUrl();
  if (!webhookUrl || typeof fetch !== 'function') {
    return;
  }

  const payload: WebhookPayload = {
    ...logEntry,
    timestamp: logEntry.timestamp.toISOString(),
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('[SecurityLoggerEdge] Failed to send webhook', error);
  }
}

export async function logSecurityEvent(
  event: Omit<SecurityLog, 'timestamp'>
): Promise<void> {
  const logEntry: SecurityLog = {
    ...event,
    timestamp: new Date(),
  };

  const emoji = getSeverityEmoji(event.severity);
  console.log(
    `${emoji} [SECURITY][EDGE] ${event.type.toUpperCase()}: ${event.message}`,
    summarizeEvent(event)
  );

  await postToWebhook(logEntry);
}

export function extractRequestInfo(request: NextRequest): {
  ip: string;
  userAgent: string;
  endpoint: string;
  method: string;
} {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip =
    forwardedFor?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  const userAgent = request.headers.get('user-agent') ?? 'unknown';
  const endpoint = request.nextUrl.pathname;
  const method = request.method;

  return { ip, userAgent, endpoint, method };
}

export async function logRateLimitExceeded(
  request: NextRequest,
  details?: { count: number; limit: number }
): Promise<void> {
  const { ip, userAgent, endpoint, method } = extractRequestInfo(request);

  await logSecurityEvent({
    type: 'rate_limit_exceeded',
    severity: 'medium',
    message: `Rate limit exceeded: ${details?.count ?? 'unknown'} requests`,
    ip,
    userAgent,
    endpoint,
    method,
    details,
  });
}

