'use client';

import Script from 'next/script';

interface RecaptchaScriptLoaderProps {
  siteKey: string;
  nonce: string | null;
}

/**
 * Client Component to load reCAPTCHA Enterprise script
 * Handles script loading events and notifies when ready
 */
export function RecaptchaScriptLoader({ siteKey, nonce }: RecaptchaScriptLoaderProps) {
  return (
    <Script
      src={`https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`}
      strategy="afterInteractive"
      nonce={nonce || undefined}
      onLoad={() => {
        // Wait for grecaptcha.ready to be available before marking as loaded
        console.log('🔄 [reCAPTCHA] Script onLoad triggered, waiting for grecaptcha.ready...');
        if (typeof window !== 'undefined') {
          let attempts = 0;
          const maxAttempts = 100; // 5 secondes max (100 * 50ms)

          const waitForReady = () => {
            attempts++;
            const grecaptcha = (window as any).grecaptcha;

            // Debug: log what's available on grecaptcha
            if (attempts === 1 && grecaptcha) {
              console.log('🔍 [reCAPTCHA] Debug - grecaptcha object:', {
                exists: !!grecaptcha,
                keys: Object.keys(grecaptcha || {}),
                readyType: typeof grecaptcha.ready,
                enterpriseType: typeof grecaptcha.enterprise,
                enterpriseReady: typeof grecaptcha.enterprise?.ready,
              });
            }

            // Pour reCAPTCHA Enterprise, vérifier enterprise.ready
            const isEnterpriseReady = grecaptcha?.enterprise && typeof grecaptcha.enterprise.ready === 'function';
            const isStandardReady = typeof grecaptcha?.ready === 'function';

            if (grecaptcha && (isEnterpriseReady || isStandardReady)) {
              // Mark reCAPTCHA as loaded and ready
              (window as any).__RECAPTCHA_LOADED__ = true;
              (window as any).__RECAPTCHA_READY__ = true;
              // Dispatch custom event to notify AppCheckInitializer
              window.dispatchEvent(new Event('recaptcha-loaded'));
              console.log(`✅ [reCAPTCHA] Script loaded and grecaptcha.ready is available (après ${attempts} tentatives)`);
            } else if (attempts < maxAttempts) {
              // Poll until grecaptcha.ready is available
              console.log(`🔄 [reCAPTCHA] Tentative ${attempts}/${maxAttempts} - grecaptcha.ready pas encore disponible`);
              setTimeout(waitForReady, 50);
            } else {
              console.error(`❌ [reCAPTCHA] Timeout après ${maxAttempts} tentatives - grecaptcha.ready toujours pas disponible`);
            }
          };

          // Start waiting for grecaptcha.ready
          waitForReady();
        }
      }}
      onError={(error) => {
        console.error('❌ [reCAPTCHA] Failed to load reCAPTCHA script:', error);
      }}
    />
  );
}

