import type { NextRequest } from 'next/server';
import { detectSqlInjection, detectXss } from './sanitization';
import { logSqlInjectionAttempt, logXssAttempt } from './security-logger';

export type ThreatType = 'sql_injection' | 'xss';

export interface ThreatFinding {
  path: string;
  type: ThreatType;
  value: string;
}

const MAX_DEPTH = 20;
const MAX_STRING_LENGTH = 10_000;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function scanObjectForThreats(
  value: unknown,
  basePath = '',
  depth = 0
): ThreatFinding[] {
  const findings: ThreatFinding[] = [];

  if (depth > MAX_DEPTH) {
    return findings; // limite anti-DoS
  }

  if (typeof value === 'string') {
    const str = value.length > MAX_STRING_LENGTH
      ? value.slice(0, MAX_STRING_LENGTH)
      : value;

    if (detectSqlInjection(str)) {
      findings.push({ path: basePath || 'root', type: 'sql_injection', value: str });
    } else if (detectXss(str)) {
      findings.push({ path: basePath || 'root', type: 'xss', value: str });
    }
    return findings;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      findings.push(...scanObjectForThreats(item, `${basePath}[${index}]`, depth + 1));
    });
    return findings;
  }

  if (isObject(value)) {
    for (const [key, entry] of Object.entries(value)) {
      const path = basePath ? `${basePath}.${key}` : key;
      findings.push(...scanObjectForThreats(entry, path, depth + 1));
    }
  }

  return findings;
}

export async function reportThreatFindings(
  request: NextRequest,
  findings: ThreatFinding[],
  userId?: string,
): Promise<void> {
  await Promise.all(
    findings.map(async finding => {
      if (finding.type === 'sql_injection') {
        await logSqlInjectionAttempt(request, finding.value, userId);
      } else {
        await logXssAttempt(request, finding.value, userId);
      }
    })
  );
}
