import { adminDb } from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

/**
 * Suspendre un commerce
 * POST /api/admin/merchants/[merchantId]/suspend
 */
export async function POST(
  { params }: { params: { merchantId: string } }
) {
  try {
    const { merchantId } = params;

    await adminDb.collection('merchants').doc(merchantId).update({
      status: 'suspended',
      suspendedAt: new Date(),
    });

    console.log(`✅ [ADMIN] Commerce ${merchantId} suspendu`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur suspension commerce:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suspension' },
      { status: 500 }
    );
  }
}

