'use client';

import { initializeAppCheckClient } from '@/lib/app-check-client';
import { useEffect } from 'react';

/**
 * Component to initialize Firebase App Check on the client side
 * Should be included in the root layout
 */
export function AppCheckInitializer() {
  useEffect(() => {
    const initAppCheck = async () => {
      console.log('🚀 [AppCheck] Démarrage de l\'initialisation...');

      // Wait for reCAPTCHA to be loaded and ready
      const waitForRecaptcha = (): Promise<void> => {
        return new Promise((resolve) => {
          let resolved = false;
          const safeResolve = () => {
            if (!resolved) {
              resolved = true;
              resolve();
            }
          };

          const checkRecaptchaReady = () => {
            const grecaptcha = (window as any).grecaptcha;
            // Check if grecaptcha exists and has the ready function (standard or enterprise)
            const isEnterpriseReady = grecaptcha?.enterprise && typeof grecaptcha.enterprise.ready === 'function';
            const isStandardReady = typeof grecaptcha?.ready === 'function';
            return !!(grecaptcha && (isEnterpriseReady || isStandardReady));
          };

          // Check if already loaded and ready
          if (typeof window !== 'undefined' && (window as any).__RECAPTCHA_READY__) {
            if (checkRecaptchaReady()) {
              console.log('✅ [AppCheck] reCAPTCHA already ready, proceeding with initialization');
              safeResolve();
              return;
            }
          }

          console.log('⏳ [AppCheck] En attente du chargement de reCAPTCHA...');

          // Wait for the load event
          const handleLoad = () => {
            console.log('📡 [AppCheck] Event recaptcha-loaded reçu');
            if (checkRecaptchaReady()) {
              window.removeEventListener('recaptcha-loaded', handleLoad);
              console.log('✅ [AppCheck] reCAPTCHA loaded event received and grecaptcha.ready confirmed');
              safeResolve();
            } else {
              console.warn('⚠️ [AppCheck] recaptcha-loaded event received but grecaptcha.ready not available');
            }
          };

          window.addEventListener('recaptcha-loaded', handleLoad);

          // Fallback: check periodically if grecaptcha is ready
          let pollCount = 0;
          const checkInterval = setInterval(() => {
            if (resolved) {
              clearInterval(checkInterval);
              return;
            }
            pollCount++;
            if (pollCount % 10 === 0) {
              console.log(`🔍 [AppCheck] Polling grecaptcha.ready... (${pollCount * 100}ms écoulées)`);
            }
            if (checkRecaptchaReady()) {
              clearInterval(checkInterval);
              window.removeEventListener('recaptcha-loaded', handleLoad);
              console.log('✅ [AppCheck] reCAPTCHA ready detected via polling');
              safeResolve();
            }
          }, 100);

          // Timeout after 20 seconds (fallback de sécurité)
          setTimeout(() => {
            if (resolved) return;
            clearInterval(checkInterval);
            window.removeEventListener('recaptcha-loaded', handleLoad);
            const isReady = checkRecaptchaReady();

            if (isReady) {
              // Si c'est prêt, c'est juste le timeout de sécurité qui se déclenche
              console.log('⏱️ [AppCheck] Timeout de sécurité atteint, mais reCAPTCHA est prêt');
            } else {
              // Vraiment pas prêt après 20 secondes
              console.error('❌ [AppCheck] reCAPTCHA script loading timeout after 20 seconds');
              const gr = (window as any).grecaptcha;
              console.log('🔍 [AppCheck] Debug info:', {
                grecaptchaExists: !!gr,
                grecaptchaReady: typeof gr?.ready,
                enterpriseExists: !!gr?.enterprise,
                enterpriseReady: typeof gr?.enterprise?.ready,
                readyFlag: (window as any).__RECAPTCHA_READY__,
                keys: gr ? Object.keys(gr) : [],
              });
            }
            safeResolve(); // Continue anyway
          }, 20000);
        });
      };

      try {
        await waitForRecaptcha();
        console.log('🔧 [AppCheck] Initialisation de App Check...');
        await initializeAppCheckClient();
        console.log('✅ [AppCheck] Initialisation terminée avec succès');
      } catch (error) {
        console.error('❌ [AppCheck] Failed to initialize App Check:', error);
      }
    };

    initAppCheck();
  }, []);

  return null; // This component doesn't render anything
}

