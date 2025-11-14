import { adminDb } from '@/lib/firebase-admin';
import { Report } from '@/types/admin';
import { NextResponse } from 'next/server';

/**
 * API Route pour la gestion des signalements
 * GET /api/admin/reports - Liste tous les signalements
 */
export async function GET() {
  try {
    const reportsSnapshot = await adminDb
      .collection('reports')
      .orderBy('createdAt', 'desc')
      .limit(500)
      .get();

    const reports: Report[] = reportsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        reporterId: data.reporterId || '',
        reporterName: data.reporterName || 'Utilisateur inconnu',
        reportedContentType: data.reportedContentType || 'message',
        reportedContentId: data.reportedContentId || '',
        reason: data.reason || '',
        description: data.description || '',
        status: data.status || 'pending',
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        resolvedAt: data.resolvedAt?.toDate?.()?.toISOString(),
        resolvedBy: data.resolvedBy,
        moderatorNotes: data.moderatorNotes,
      };
    });

    return NextResponse.json({ reports }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur chargement signalements:', error);
    return NextResponse.json(
      { error: 'Erreur lors du chargement des signalements' },
      { status: 500 }
    );
  }
}

