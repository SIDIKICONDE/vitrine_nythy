import { ErrorLog } from '@/types/admin';
import { NextResponse } from 'next/server';

/**
 * Récupérer les logs d'erreurs
 * GET /api/admin/errors
 */
export async function GET() {
  try {
    // Simuler des erreurs (à remplacer par des vrais logs)
    const errors: ErrorLog[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        level: 'error',
        message: 'Failed to connect to database',
        path: '/api/merchants',
        method: 'GET',
        statusCode: 500,
        stack: 'Error: Connection timeout\n    at Database.connect (db.ts:45)\n    at API.handler (route.ts:12)',
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        level: 'warning',
        message: 'Slow query detected',
        path: '/api/orders',
        method: 'POST',
        metadata: { duration: 5234 },
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        level: 'critical',
        message: 'Payment processing failed',
        path: '/api/payments',
        method: 'POST',
        statusCode: 500,
        userId: 'user123',
      },
    ];

    return NextResponse.json({ errors }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur chargement logs:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des logs' },
      { status: 500 }
    );
  }
}

