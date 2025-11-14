/**
 * Utilitaires d'authentification et d'autorisation admin
 */

import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

/**
 * Vérifie si l'utilisateur actuel est un admin
 * À utiliser dans les Server Components et Route Handlers
 */
export async function checkIsAdmin(): Promise<{
  isAdmin: boolean;
  userId?: string;
  user?: any;
}> {
  try {
    const session = await auth();

    if (!session?.user) {
      return { isAdmin: false };
    }

    const userId = (session.user as any).id;

    if (!userId) {
      return { isAdmin: false, user: session.user };
    }

    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.log('❌ [Admin Auth] Utilisateur non trouvé:', userId);
      return { isAdmin: false, userId, user: session.user };
    }

    const userData = userDoc.data();
    const role = userData?.['role'];

    console.log('🔐 [Admin Auth] Vérification:', { userId, role });

    return {
      isAdmin: role === 'admin',
      userId,
      user: session.user,
    };
  } catch (error) {
    console.error('❌ [Admin Auth] Erreur:', error);
    return { isAdmin: false };
  }
}

/**
 * Middleware pour les routes API admin
 * Lance une erreur 403 si l'utilisateur n'est pas admin
 */
export async function requireAdmin(): Promise<{
  userId: string;
  user: any;
}> {
  const { isAdmin, userId, user } = await checkIsAdmin();

  if (!isAdmin) {
    throw new Error('ADMIN_ACCESS_DENIED');
  }

  return { userId: userId!, user };
}

/**
 * Crée une réponse d'erreur pour accès refusé
 */
export function createAdminAccessDeniedResponse() {
  return new Response(
    JSON.stringify({
      success: false,
      error: 'Access Denied',
      message: 'Vous devez être administrateur pour accéder à cette ressource',
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Wrapper pour les route handlers admin
 * Vérifie automatiquement l'accès admin et gère les erreurs
 */
export function withAdminAuth<T extends any[]>(
  handler: (userId: string, user: any, ...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      const { userId, user } = await requireAdmin();
      return await handler(userId, user, ...args);
    } catch (error) {
      if (error instanceof Error && error.message === 'ADMIN_ACCESS_DENIED') {
        return createAdminAccessDeniedResponse();
      }

      console.error('❌ [Admin Route] Erreur:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal Server Error',
          message: 'Une erreur est survenue',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  };
}

