/**
 * Client-side Firebase App Check utility
 * Handles App Check token retrieval for web applications
 */

import { ReCaptchaEnterpriseProvider, getToken, initializeAppCheck, type AppCheck } from 'firebase/app-check';
import app from './firebase';

let appCheckInitialized = false;
let appCheckInstance: AppCheck | null = null;

/**
 * Initializes Firebase App Check for web
 * Should be called once when the app starts
 */
export async function initializeAppCheckClient(): Promise<void> {
  if (appCheckInitialized) {
    return; // Already initialized
  }

  if (typeof window === 'undefined') {
    return; // SSR safe
  }

  // En mode développement local, on peut skip AppCheck si pas configuré correctement
  const isDevelopment = process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  try {
    const recaptchaSiteKey = process.env['NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY'];

    if (!recaptchaSiteKey) {
      if (isDevelopment) {
        console.warn('⚠️ [AppCheck] NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY not configured. Skipping in development mode.');
      } else {
        console.error('❌ [AppCheck] NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY not configured. App Check will not work.');
      }
      appCheckInitialized = true; // Marquer comme initialisé pour éviter de réessayer
      return;
    }

    // Verify that grecaptcha is available and ready before initializing
    const grecaptcha = (window as any).grecaptcha;

    if (!grecaptcha) {
      if (isDevelopment) {
        console.warn('⚠️ [AppCheck] grecaptcha not available. Skipping in development mode.');
      } else {
        console.error('❌ [AppCheck] grecaptcha not available. Make sure reCAPTCHA script is loaded first.');
      }
      appCheckInitialized = true;
      return;
    }

    // Support both standard and enterprise reCAPTCHA
    const isEnterpriseReady = grecaptcha.enterprise && typeof grecaptcha.enterprise.ready === 'function';
    const isStandardReady = typeof grecaptcha.ready === 'function';

    if (!isEnterpriseReady && !isStandardReady) {
      console.error('❌ [AppCheck] grecaptcha.ready or grecaptcha.enterprise.ready not available.');
      console.log('🔍 [AppCheck] Debug - grecaptcha object:', {
        hasEnterprise: !!grecaptcha.enterprise,
        hasReady: !!grecaptcha.ready,
        keys: Object.keys(grecaptcha),
      });
      appCheckInitialized = true;
      return;
    }

    // Wait for grecaptcha.ready (or enterprise.ready) to ensure reCAPTCHA is fully initialized
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('grecaptcha.ready() timeout after 10 seconds'));
      }, 10000);

      try {
        const readyFn = isEnterpriseReady ? grecaptcha.enterprise.ready : grecaptcha.ready;
        readyFn(() => {
          clearTimeout(timeout);
          console.log('✅ [AppCheck] grecaptcha.ready() callback executed');
          resolve();
        });
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });

    // Initialize App Check with reCAPTCHA Enterprise
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true, // Automatically refresh tokens
    });

    appCheckInitialized = true;
    console.log('✅ [AppCheck] Initialized successfully with reCAPTCHA Enterprise');

    // Note: Les erreurs 400 "appCheck/initial-throttle" sont normales au démarrage
    // Firebase limite les tentatives d'échange de token. Le token sera obtenu automatiquement
    // après quelques secondes grâce à isTokenAutoRefreshEnabled.
  } catch (error: any) {
    // Ignorer les erreurs de throttling et autres en mode développement
    if (error?.message?.includes('throttle') || error?.code === 'appCheck/initial-throttle' || error?.code === 'appCheck/throttled') {
      if (isDevelopment) {
        console.warn('⚠️ [AppCheck] Token throttled in development mode. Continuing without AppCheck token.');
      } else {
        console.warn('⚠️ [AppCheck] Throttling détecté. Le token sera obtenu automatiquement.');
      }
      appCheckInitialized = true; // Marquer comme initialisé quand même
    } else if (error?.message?.includes('400') || error?.status === 400) {
      // Erreur 400 - probablement une mauvaise configuration reCAPTCHA
      if (isDevelopment) {
        console.warn('⚠️ [AppCheck] 400 error - reCAPTCHA Enterprise key may not be properly configured in Firebase Console.');
        console.warn('ℹ️  To fix: Go to Firebase Console > App Check > Add reCAPTCHA Enterprise provider');
        console.warn('ℹ️  Continuing without AppCheck in development mode.');
      } else {
        console.error('❌ [AppCheck] 400 error - Check reCAPTCHA Enterprise configuration in Firebase Console');
      }
      appCheckInitialized = true;
    } else {
      console.error('❌ [AppCheck] Initialization failed:', error);
      appCheckInitialized = true; // Marquer comme initialisé pour éviter de boucler
      // Don't throw - allow app to continue without App Check in case of error
    }
  }
}

/**
 * Gets the current App Check token
 * @param forceRefresh If true, forces a token refresh
 * @returns The App Check token or null if unavailable
 */
export async function getAppCheckToken(forceRefresh = false): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null; // SSR safe
  }

  const isDevelopment = process.env.NODE_ENV === 'development' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (!appCheckInitialized) {
    // Try to initialize if not already done
    await initializeAppCheckClient();
    // Attendre un peu après l'initialisation pour éviter le throttling
    if (!isDevelopment) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  try {
    if (!appCheckInstance) {
      if (!isDevelopment) {
        console.warn('⚠️ [AppCheck] App Check not initialized');
      }
      return null;
    }

    const result = await getToken(appCheckInstance, forceRefresh);
    return result.token;
  } catch (error: any) {
    // Ignorer les erreurs de throttling et 400 en mode développement
    if (error?.code === 'appCheck/throttled' || error?.code === 'appCheck/initial-throttle') {
      if (!isDevelopment) {
        console.warn('⚠️ [AppCheck] Token throttled, will retry automatically. Continuing without token for now.');
      }
      return null; // Retourner null au lieu de bloquer l'application
    }
    if (error?.message?.includes('400') || error?.status === 400) {
      // Erreur 400 - ne pas spam les logs en développement
      if (!isDevelopment) {
        console.error('❌ [AppCheck] Failed to get token (400 error):', error);
      }
      return null;
    }
    if (!isDevelopment) {
      console.error('❌ [AppCheck] Failed to get token:', error);
    }
    return null;
  }
}

/**
 * Gets App Check token with automatic retry on failure
 * @param retries Number of retry attempts
 * @returns The App Check token or null if all retries fail
 */
export async function getAppCheckTokenWithRetry(retries = 2): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    const token = await getAppCheckToken(i > 0); // Force refresh on retry
    if (token) {
      return token;
    }

    if (i < retries) {
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }

  return null;
}

