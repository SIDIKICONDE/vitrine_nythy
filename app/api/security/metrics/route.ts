import { verifyAppCheckToken } from '@/lib/app-check-middleware';
import { getSecurityMetrics } from '@/lib/security/security-logger';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/security/metrics
 * Fournit des métriques consolidées sur les attaques et alertes de sécurité
 * 🔐 Protégé par App Check (utilisable depuis le dashboard admin)
 */
export async function GET(request: NextRequest) {
  const appCheckResult = await verifyAppCheckToken(request, { strict: true });
  if (appCheckResult instanceof NextResponse) {
    return appCheckResult;
  }

  const metrics = await getSecurityMetrics();
  return NextResponse.json({
    success: true,
    metrics,
    generatedAt: new Date().toISOString(),
  });
}

