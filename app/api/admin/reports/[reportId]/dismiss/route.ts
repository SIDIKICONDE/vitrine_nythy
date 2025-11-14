import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Rejeter un signalement
 * POST /api/admin/reports/[reportId]/dismiss
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const { reportId } = params;

    await adminDb.collection('reports').doc(reportId).update({
      status: 'dismissed',
      resolvedAt: new Date(),
      resolvedBy: 'admin', // TODO: Récupérer l'ID de l'admin connecté
    });

    console.log(`✅ [ADMIN] Signalement ${reportId} rejeté`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur rejet signalement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du rejet' },
      { status: 500 }
    );
  }
}

