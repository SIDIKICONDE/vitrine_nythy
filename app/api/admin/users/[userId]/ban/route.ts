import { adminDb } from '@/lib/firebase-admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Bannir un utilisateur
 * POST /api/admin/users/[userId]/ban
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    await adminDb.collection('users').doc(userId).update({
      isBanned: true,
      bannedAt: new Date(),
    });

    console.log(`✅ [ADMIN] Utilisateur ${userId} banni`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ [ADMIN] Erreur bannissement:', error);
    return NextResponse.json(
      { error: 'Erreur lors du bannissement' },
      { status: 500 }
    );
  }
}

