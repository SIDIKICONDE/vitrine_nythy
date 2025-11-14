import { CacheMetrics } from '@/types/admin';
import { NextResponse } from 'next/server';

/**
 * Récupérer les métriques du cache
 * GET /api/admin/cache/metrics
 */
export async function GET() {
  try {
    // Simuler des métriques (à remplacer par des vraies métriques)
    const metrics: CacheMetrics = {
      totalKeys: 1247,
      memoryUsage: 52428800, // 50 MB en bytes
      hitRate: 0.87,
      missRate: 0.13,
      evictionCount: 142,
      averageAccessTime: 1.2,
      topKeys: [
        { key: 'merchants:list', hits: 4521, size: 524288 },
        { key: 'users:active', hits: 3892, size: 262144 },
        { key: 'offers:featured', hits: 2134, size: 131072 },
        { key: 'stats:dashboard', hits: 1567, size: 65536 },
        { key: 'merchants:verified', hits: 987, size: 98304 },
      ],
    };

    return NextResponse.json({ metrics }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur métriques cache:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques' },
      { status: 500 }
    );
  }
}

