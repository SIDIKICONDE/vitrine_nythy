/**
 * Middleware App Check pour vérifier les jetons Firebase App Check
 * 
 * Ce middleware vérifie que chaque requête contient un jeton App Check valide
 * pour protéger le backend contre les abus et les attaques.
 */

import { getAppCheck } from 'firebase-admin/app-check';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Options pour la vérification App Check
 */
export interface AppCheckOptions {
  /**
   * Si true, consomme le jeton (protection contre le rejeu)
   * Recommandé uniquement pour les endpoints sensibles (ajoute de la latence)
   */
  consumeToken?: boolean;

  /**
   * Si true, retourne une erreur 401 si le jeton est manquant ou invalide
   * Si false, retourne juste `null` pour les jetons invalides
   */
  strict?: boolean;
}

/**
 * Vérifie le jeton App Check dans une requête Next.js
 * 
 * @param request - La requête Next.js
 * @param options - Options de vérification
 * @returns Les claims du jeton décodé, ou null si invalide
 */
export async function verifyAppCheckToken(
  request: NextRequest,
  options: AppCheckOptions = {}
) {
  // En développement, être moins strict par défaut pour éviter les problèmes de throttling
  const isDev = process.env['NODE_ENV'] === 'development';
  // FORCER strict = false en développement, même si strict: true est passé
  const { consumeToken = false, strict = false } = options;
  const effectiveStrict = isDev ? false : strict;

  // Récupérer le jeton depuis le header X-Firebase-AppCheck
  const appCheckToken = request.headers.get('X-Firebase-AppCheck');

  // Pas de jeton
  if (!appCheckToken) {
    if (effectiveStrict) {
      return NextResponse.json(
        {
          success: false,
          error: 'App Check token missing',
          message: 'Jeton App Check manquant'
        },
        { status: 401 }
      );
    }
    // En développement, continuer sans token
    if (isDev) {
      console.warn('⚠️ [AppCheck] No token provided, but continuing in development mode');
    }
    return null;
  }

  try {
    // Vérifier le jeton
    const appCheckClaims = await getAppCheck().verifyToken(appCheckToken, {
      consume: consumeToken,
    });

    // Vérifier si le jeton a déjà été consommé
    if (consumeToken && appCheckClaims.alreadyConsumed) {
      if (effectiveStrict) {
        return NextResponse.json(
          {
            success: false,
            error: 'Token already consumed',
            message: 'Jeton déjà utilisé (protection contre le rejeu)'
          },
          { status: 401 }
        );
      }
      return null;
    }

    // Succès ! Le jeton est valide
    return appCheckClaims;

  } catch (error: any) {
    console.error('❌ Erreur vérification App Check:', error);

    if (effectiveStrict) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid App Check token',
          message: 'Jeton App Check invalide',
          details: error.message
        },
        { status: 401 }
      );
    }
    return null;
  }
}

/**
 * HOC (Higher Order Component) pour protéger une route API avec App Check
 * 
 * Exemple d'utilisation:
 * ```ts
 * export const GET = withAppCheck(async (request) => {
 *   // Votre logique ici
 *   return NextResponse.json({ success: true });
 * });
 * ```
 */
export function withAppCheck(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: AppCheckOptions = {}
) {
  return async (request: NextRequest) => {
    // Vérifier le jeton App Check
    const result = await verifyAppCheckToken(request, { ...options, strict: true });

    // Si le résultat est une NextResponse (erreur), la retourner
    if (result instanceof NextResponse) {
      return result;
    }

    // Sinon, continuer avec le handler
    return handler(request);
  };
}

/**
 * Middleware Express.js pour App Check (si vous utilisez Express)
 * 
 * Exemple:
 * ```ts
 * app.get('/api/protected', appCheckMiddleware(), (req, res) => {
 *   res.json({ success: true });
 * });
 * ```
 */
export function appCheckMiddleware(options: AppCheckOptions = {}) {
  const { consumeToken = false } = options;

  return async (req: any, res: any, next: any) => {
    const appCheckToken = req.header('X-Firebase-AppCheck');

    if (!appCheckToken) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Jeton App Check manquant'
      });
      return;
    }

    try {
      const appCheckClaims = await getAppCheck().verifyToken(appCheckToken, {
        consume: consumeToken,
      });

      // Vérifier si déjà consommé
      if (consumeToken && appCheckClaims.alreadyConsumed) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'Jeton déjà utilisé'
        });
        return;
      }

      // Ajouter les claims à la requête pour les utiliser plus tard
      req.appCheckClaims = appCheckClaims;

      // Continuer
      return next();

    } catch (err: any) {
      console.error('❌ Erreur vérification App Check:', err);
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Jeton App Check invalide',
        details: err.message
      });
    }
  };
}

