/**
 * PROXY ULTRA-SÉCURISÉ v2.1 - OPTIMISÉ ⚡
 * 
 * Fonctionnalités:
 * ✅ Rate limiting distribué avec Redis (Upstash)
 * ✅ CSRF avec rotation et expiration
 * ✅ CSP avec nonces dynamiques
 * ✅ IP Intelligence & Géolocalisation (avec cache 1h)
 * ✅ Détection d'anomalies en temps réel
 * ✅ Auto-blocking progressif
 * ✅ Monitoring et alertes
 * ✅ Logging complet
 * ✅ Headers de sécurité renforcés
 * 
 * Optimisations v2.1:
 * ⚡ Ordre optimal des vérifications (rate limit en premier)
 * ⚡ Parallélisation IP Intelligence + Anomaly Detection
 * ⚡ Cache IP Intelligence (réutilisation sur 1h)
 * ⚡ Early returns pour économiser les ressources
 * ⚡ Réduction latence: ~50-100ms économisés par requête
 */

import { auth } from '@/lib/auth';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Security modules
import {
  analyzeAndBlock,
  recordRequest,
} from '@/lib/security/anomaly-detection';
import {
  applyCspHeaders,
  generateNonce,
} from '@/lib/security/csp-nonce';
import {
  CSRF_SAFE_METHODS,
  csrfErrorResponse,
  ensureCsrfCookie,
  validateCsrfRequest,
} from '@/lib/security/csrf-edge-v2';
import {
  analyzeRequest,
} from '@/lib/security/ip-intelligence';
import {
  recordMetric,
  recordResponseTime,
  updateIpMetrics,
} from '@/lib/security/monitoring';
import {
  checkRateLimit,
  getClientIp,
  getRateLimitConfigForEndpoint,
} from '@/lib/security/rate-limiter-distributed';
import {
  logRateLimitExceeded,
  logSecurityEvent
} from '@/lib/security/security-logger-edge';

// ==================== CONFIGURATION ====================

const ALLOWED_ORIGINS = (process.env['NEXT_PUBLIC_ALLOWED_ORIGINS'] ??
  'https://nythy.app,http://localhost:3000').split(',').map(value => value.trim());

// Headers de sécurité renforcés
const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

// ==================== HELPERS ====================

/**
 * Vérifie si un utilisateur a le rôle admin dans Firestore
 */
async function checkAdminRole(userId: string): Promise<boolean> {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');

    const userDoc = await adminDb.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      console.log('❌ [Admin Check] Utilisateur non trouvé:', userId);
      return false;
    }

    const userData = userDoc.data();
    const role = userData?.['role'];

    console.log('🔐 [Admin Check] Vérification rôle:', { userId, role });

    return role === 'admin';
  } catch (error) {
    console.error('❌ [Admin Check] Erreur vérification rôle:', error);
    return false;
  }
}

/**
 * Génère les headers CORS
 */
function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : 'null';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-AppCheck, X-CSRF-Token, X-XSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Applique tous les headers de sécurité
 */
function applySecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  nonce: string
): void {
  // CORS
  const corsHeaders = getCorsHeaders(request);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CSP avec nonce
  applyCspHeaders(response, nonce);
}

/**
 * Crée une réponse d'erreur sécurisée
 */
function createErrorResponse(
  request: NextRequest,
  status: number,
  error: string,
  message: string,
  details?: Record<string, any>
): NextResponse {
  const response = NextResponse.json(
    {
      success: false,
      error,
      message,
      ...(process.env['NODE_ENV'] === 'development' && details ? { details } : {}),
    },
    { status, headers: getCorsHeaders(request) }
  );

  // Ajouter les headers de sécurité même sur les erreurs
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// ==================== MAIN PROXY ====================

export default auth(async (req: NextRequest) => {
  const startTime = Date.now();
  const pathname = req.nextUrl.pathname;
  const method = req.method;

  // Générer un nonce pour CSP
  const nonce = generateNonce();

  try {
    // ============================================================
    // 1. PREFLIGHT (OPTIONS) - Répondre immédiatement
    // ============================================================
    if (method === 'OPTIONS') {
      const response = NextResponse.json(null, { status: 204 });
      applySecurityHeaders(req, response, nonce);
      await ensureCsrfCookie(req, response);
      recordMetric('request');
      return response;
    }

    recordMetric('request');
    const ip = getClientIp(req);
    const isApiRoute = pathname.startsWith('/api');
    const isNextAuthRoute = pathname.startsWith('/api/auth');
    const isSafeMethod = CSRF_SAFE_METHODS.has(method);

    // ============================================================
    // 2. RATE LIMITING (Vérifier en PREMIER pour économiser ressources)
    // ============================================================
    if (isApiRoute) {
      const rateLimitConfig = getRateLimitConfigForEndpoint(pathname);
      const rateLimitResult = await checkRateLimit(req, rateLimitConfig, {
        tier: 'endpoint',
      });

      if (!rateLimitResult.allowed) {
        recordMetric('rateLimit');
        await logRateLimitExceeded(req, {
          count: rateLimitConfig.maxRequests - rateLimitResult.remaining,
          limit: rateLimitConfig.maxRequests,
        });

        const response = createErrorResponse(
          req,
          429,
          'Too Many Requests',
          'You have exceeded the rate limit. Please try again later.',
          {
            retryAfter: rateLimitResult.retryAfter,
            resetAt: new Date(rateLimitResult.resetAt).toISOString(),
          }
        );

        // Headers de rate limiting
        response.headers.set('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
        response.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString());
        if (rateLimitResult.retryAfter) {
          response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
        }

        recordResponseTime(Date.now() - startTime, 429);
        return response;
      }

      // Ajouter les headers de rate limiting sur les requêtes réussies
      req.headers.set('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString());
      req.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
      req.headers.set('X-RateLimit-Reset', rateLimitResult.resetAt.toString());
    }

    // ============================================================
    // 3. ANALYSE PARALLÈLE (IP Intelligence + Anomaly Detection)
    // ============================================================
    // Collecter les événements de sécurité récents pour anomaly detection
    // Note: Pour l'instant vide, pourrait être enrichi avec:
    // - Patterns d'attaque détectés (SQL injection, XSS, etc.)
    // - Violations CSRF/CORS récentes
    // - Tentatives de brute force
    const securityEvents: string[] = [];

    // OPTIMISATION: Ces deux analyses se font en parallèle (indépendantes)
    // Gain: ~50-100ms par requête vs séquentiel
    const [ipAnalysisResult, anomalyResult] = await Promise.all([
      analyzeRequest(req),
      analyzeAndBlock(ip, req, securityEvents)
    ]);

    const { analysis, behavior, shouldBlock, blockReason } = ipAnalysisResult;
    const { blocked, anomalyScore, attackPatterns } = anomalyResult;

    // Mettre à jour les métriques IP
    updateIpMetrics(analysis);

    // ============================================================
    // 4. BLOQUER SI IP À HAUT RISQUE OU ANOMALIE DÉTECTÉE
    // ============================================================
    if (shouldBlock) {
      recordMetric('block');
      await logSecurityEvent({
        type: 'suspicious_activity',
        severity: 'high',
        message: `Blocked high-risk IP: ${blockReason}`,
        ip,
        userAgent: req.headers.get('user-agent') || undefined,
        endpoint: pathname,
        method,
        details: { analysis, behavior, blockReason },
      });

      const response = createErrorResponse(
        req,
        403,
        'Access Denied',
        'Your request has been blocked due to suspicious activity.'
      );
      recordResponseTime(Date.now() - startTime, 403);
      return response;
    }

    if (blocked) {
      recordMetric('block');
      recordMetric('anomaly');

      const response = createErrorResponse(
        req,
        403,
        'Access Denied',
        'Suspicious activity detected. Your IP has been temporarily blocked.'
      );
      recordResponseTime(Date.now() - startTime, 403);
      return response;
    }

    // Log si score d'anomalie élevé (sans bloquer)
    if (anomalyScore.overall >= 60) {
      recordMetric('anomaly');
      await logSecurityEvent({
        type: 'suspicious_activity',
        severity: anomalyScore.severity,
        message: `High anomaly score detected: ${anomalyScore.overall}`,
        ip,
        userAgent: req.headers.get('user-agent') || undefined,
        endpoint: pathname,
        method,
        details: { anomalyScore, attackPatterns },
      });
    }

    // ============================================================
    // 5. CSRF VALIDATION (API routes non-safe uniquement)
    // ============================================================
    if (isApiRoute && !isSafeMethod && !isNextAuthRoute) {
      const csrfValidation = await validateCsrfRequest(req);

      if (!csrfValidation.valid) {
        recordMetric('csrfFailed');
        await logSecurityEvent({
          type: 'csrf_attempt',
          severity: 'high',
          message: `CSRF validation failed: ${csrfValidation.error}`,
          ip,
          userAgent: req.headers.get('user-agent') || undefined,
          endpoint: pathname,
          method,
          details: { error: csrfValidation.error },
        });

        const response = csrfErrorResponse(
          csrfValidation.error || 'Invalid CSRF token',
          csrfValidation.code
        );

        // Ajouter les headers CORS
        const corsHeaders = getCorsHeaders(req);
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });

        recordResponseTime(Date.now() - startTime, csrfValidation.code || 403);
        return response;
      }
    }

    // ============================================================
    // 6. REDIRECTIONS (Vérifier AVANT les opérations lourdes)
    // ============================================================
    // Redirection /marchand -> /merchant
    if (pathname.startsWith('/marchand')) {
      const merchantPath = pathname.replace('/marchand', '/merchant');
      const response = NextResponse.redirect(new URL(merchantPath, req.url));
      applySecurityHeaders(req, response, nonce);
      recordResponseTime(Date.now() - startTime, 307);
      return response;
    }

    // ============================================================
    // 7. AUTHENTICATION & AUTHORIZATION (Admin routes)
    // ============================================================
    const isOnAdmin = pathname.startsWith('/admin');
    const isOnLogin = pathname === '/admin/login';
    const isLoggedIn = !!(req as any).auth;
    const session = (req as any).auth;

    if (isOnAdmin) {
      // Rediriger vers login si non authentifié
      if (!isOnLogin && !isLoggedIn) {
        console.log('🔐 [Admin] Non authentifié, redirection vers login');
        const loginUrl = new URL('/admin/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        const response = NextResponse.redirect(loginUrl);
        applySecurityHeaders(req, response, nonce);
        recordResponseTime(Date.now() - startTime, 307);
        return response;
      }

      // Vérifier le rôle admin (sauf pour la page de login)
      if (!isOnLogin && isLoggedIn && session?.user) {
        const userId = (session.user as any).id;

        if (userId) {
          const isAdmin = await checkAdminRole(userId);

          if (!isAdmin) {
            console.log('🔐 [Admin] Accès refusé - Pas de rôle admin:', userId);

            // Logger l'événement de sécurité
            await logSecurityEvent({
              type: 'unauthorized_access',
              severity: 'medium',
              message: 'Tentative d\'accès admin sans autorisation',
              ip: getClientIp(req),
              userAgent: req.headers.get('user-agent') || undefined,
              endpoint: pathname,
              method,
              userId,
              details: { email: session.user.email },
            });

            // Rediriger vers l'accueil avec message d'erreur
            const homeUrl = new URL('/', req.url);
            homeUrl.searchParams.set('error', 'access_denied');
            homeUrl.searchParams.set('message', 'Vous devez être administrateur pour accéder à cette page');
            const response = NextResponse.redirect(homeUrl);
            applySecurityHeaders(req, response, nonce);
            recordResponseTime(Date.now() - startTime, 307);
            return response;
          }

          console.log('✅ [Admin] Accès autorisé:', userId);
        }
      }

      // Rediriger vers admin si déjà authentifié sur login
      if (isOnLogin && isLoggedIn) {
        console.log('🔐 [Admin] Déjà authentifié, redirection vers dashboard');
        const response = NextResponse.redirect(new URL('/admin', req.url));
        applySecurityHeaders(req, response, nonce);
        recordResponseTime(Date.now() - startTime, 307);
        return response;
      }
    }

    // ============================================================
    // 7b. AUTHENTICATION & AUTHORIZATION (Merchant routes)
    // ============================================================
    const isOnMerchant = pathname.startsWith('/merchant');
    const isOnMerchantAuth = pathname.startsWith('/merchant/login') ||
      pathname.startsWith('/merchant/register') ||
      pathname.startsWith('/merchant/auth');

    if (isOnMerchant && !isOnMerchantAuth) {
      // Rediriger vers login si non authentifié
      if (!isLoggedIn) {
        console.log('🔐 [Merchant] Non authentifié, redirection vers login');
        const loginUrl = new URL('/merchant/login', req.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        const response = NextResponse.redirect(loginUrl);
        applySecurityHeaders(req, response, nonce);
        recordResponseTime(Date.now() - startTime, 307);
        return response;
      }

      // Rediriger les admins vers /admin
      if (isLoggedIn && session?.user) {
        const userId = (session.user as any).id;

        if (userId) {
          const isAdmin = await checkAdminRole(userId);

          if (isAdmin) {
            console.log('🔄 [Merchant] Admin détecté, redirection vers /admin');
            const response = NextResponse.redirect(new URL('/admin', req.url));
            applySecurityHeaders(req, response, nonce);
            recordResponseTime(Date.now() - startTime, 307);
            return response;
          }

          console.log('✅ [Merchant] Accès autorisé pour merchant:', userId);
        }
      }
    }

    // Rediriger vers dashboard si déjà authentifié sur merchant login/register
    if (isOnMerchantAuth && isLoggedIn) {
      console.log('🔐 [Merchant] Déjà authentifié, redirection vers dashboard');
      const response = NextResponse.redirect(new URL('/merchant/dashboard', req.url));
      applySecurityHeaders(req, response, nonce);
      recordResponseTime(Date.now() - startTime, 307);
      return response;
    }

    // ============================================================
    // 8. RESPONSE FINALE avec headers de sécurité
    // ============================================================
    const response = NextResponse.next();

    // Appliquer tous les headers de sécurité
    applySecurityHeaders(req, response, nonce);

    // Assurer le cookie CSRF
    await ensureCsrfCookie(req, response);

    // Enregistrer les métriques de comportement
    recordRequest(ip, req, 200, analysis.location?.country);

    recordResponseTime(Date.now() - startTime, 200);
    return response;

  } catch (error) {
    // ============================================================
    // GESTION D'ERREURS GLOBALE
    // ============================================================
    console.error('[Proxy] Unexpected error:', error);

    await logSecurityEvent({
      type: 'suspicious_activity',
      severity: 'high',
      message: 'Proxy error',
      ip: getClientIp(req),
      userAgent: req.headers.get('user-agent') || undefined,
      endpoint: pathname,
      method,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    const response = createErrorResponse(
      req,
      500,
      'Internal Server Error',
      'An unexpected error occurred. Please try again later.'
    );

    recordResponseTime(Date.now() - startTime, 500);
    return response;
  }
});

// ==================== CONFIGURATION ====================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

