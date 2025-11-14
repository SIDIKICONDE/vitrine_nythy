import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Vérifier un commerce
 * POST /api/admin/merchants/[merchantId]/verify
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { merchantId: string } }
) {
  try {
    const { merchantId } = params;

    await adminDb.collection('merchants').doc(merchantId).update({
      isVerified: true,
      status: 'active',
      verifiedAt: new Date(),
    });

    console.log(`✅ [ADMIN] Commerce ${merchantId} vérifié`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur vérification commerce:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}

