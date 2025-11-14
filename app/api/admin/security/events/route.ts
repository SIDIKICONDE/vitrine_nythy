import { SecurityEvent } from '@/types/admin';
import { NextResponse } from 'next/server';

/**
 * Récupérer les événements de sécurité
 * GET /api/admin/security/events
 */
export async function GET() {
  try {
    // Simuler des événements (à remplacer par des vrais logs)
    const events: SecurityEvent[] = [
      {
        id: '1',
        type: 'failed_login',
        userEmail: 'test@example.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0',
        severity: 'medium',
        description: 'Tentative de connexion échouée',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '2',
        type: 'suspicious_activity',
        userEmail: 'suspicious@example.com',
        ipAddress: '10.0.0.50',
        userAgent: 'curl/7.68.0',
        severity: 'high',
        description: 'Activité suspecte détectée',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur chargement événements:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des événements' },
      { status: 500 }
    );
  }
}

