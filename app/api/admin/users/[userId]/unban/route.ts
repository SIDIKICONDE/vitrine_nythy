import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Débannir un utilisateur
 * POST /api/admin/users/[userId]/unban
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    await adminDb.collection('users').doc(userId).update({
      isBanned: false,
      unbannedAt: new Date(),
    });

    console.log(`✅ [ADMIN] Utilisateur ${userId} débanni`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur débannissement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du débannissement' },
      { status: 500 }
    );
  }
}

