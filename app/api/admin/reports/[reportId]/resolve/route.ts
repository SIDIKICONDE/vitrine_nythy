import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Résoudre un signalement
 * POST /api/admin/reports/[reportId]/resolve
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { reportId: string } }
) {
  try {
    const { reportId } = params;

    await adminDb.collection('reports').doc(reportId).update({
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedBy: 'admin', // TODO: Récupérer l'ID de l'admin connecté
    });

    console.log(`✅ [ADMIN] Signalement ${reportId} résolu`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur résolution signalement:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la résolution' },
      { status: 500 }
    );
  }
}

