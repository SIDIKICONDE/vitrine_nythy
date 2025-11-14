import { checkIsAdmin } from '@/lib/admin-auth';
import { NextResponse } from 'next/server';

/**
 * API pour vérifier si l'utilisateur actuel est admin
 * Utilisé après le login pour valider les permissions
 */
export async function GET() {
  try {
    const { isAdmin, userId, user } = await checkIsAdmin();

    return NextResponse.json({
      success: true,
      isAdmin,
      userId,
      user: user
        ? {
            email: user.email,
            name: user.name,
          }
        : null,
    });
  } catch (error) {
    console.error('❌ [Check Role API] Erreur:', error);
    return NextResponse.json(
      {
        success: false,
        isAdmin: false,
        error: 'Erreur lors de la vérification du rôle',
      },
      { status: 500 }
    );
  }
}

