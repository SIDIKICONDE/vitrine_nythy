/**
 * TwoFactorSetup - Composant pour activer le 2FA
 * Affiche le QR code et permet la vérification du code TOTP
 */

'use client';

import { createAuthHeaders } from '@/lib/csrf-client';
import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

interface TwoFactorSetupProps {
  userId: string;
  onComplete: (recoveryCodes: string[]) => void;
  onCancel: () => void;
}

export default function TwoFactorSetup({
  userId,
  onComplete,
  onCancel
}: TwoFactorSetupProps) {
  const [step, setStep] = useState<'loading' | 'qr' | 'verify'>('loading');
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Étape 1 : Générer le QR Code au montage
  useEffect(() => {
    generateQRCode();
  }, []);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError('');

      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch('/api/merchant/2fa/enable', {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        setSecret(data.secret);
        setQrCodeUrl(data.qrCodeUrl);
        setStep('qr');
      } else {
        setError(data.message || 'Erreur lors de la génération du QR Code');
        setStep('qr'); // Afficher quand même pour voir l'erreur
      }
    } catch (err) {
      console.error('❌ Erreur génération QR:', err);
      setError('Erreur lors de la génération du QR Code');
      setStep('qr');
    } finally {
      setLoading(false);
    }
  };

  // Étape 2 : Vérifier le code
  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      setError('Le code doit contenir 6 chiffres');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const headers = await createAuthHeaders({
        'Content-Type': 'application/json',
      });

      const response = await fetch('/api/merchant/2fa/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Passer les codes de récupération au parent
        onComplete(data.recoveryCodes || []);
      } else {
        setError(data.message || 'Code invalide');
      }
    } catch (err) {
      console.error('❌ Erreur vérification:', err);
      setError('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-foreground-muted">Génération du QR Code...</p>
        </div>
      </div>
    );
  }

  // QR Code step
  if (step === 'qr') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-2 text-foreground">
            📱 Scannez ce QR Code
          </h3>
          <p className="text-sm text-foreground-muted">
            Ouvrez votre application d&apos;authentification (Google Authenticator, Microsoft Authenticator) et scannez ce code
          </p>
        </div>

        {/* Erreur */}
        {error && !qrCodeUrl && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* QR Code */}
        {qrCodeUrl && (
          <>
            <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-border">
              <QRCodeSVG value={qrCodeUrl} size={200} />
            </div>

            {/* Secret manuel */}
            <div className="bg-surface-hover p-4 rounded-lg">
              <p className="text-xs text-foreground-muted mb-2">
                Ou entrez cette clé manuellement :
              </p>
              <code className="text-sm font-mono bg-white px-3 py-2 rounded border border-border block break-all">
                {secret}
              </code>
            </div>
          </>
        )}

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-surface-hover hover:bg-surface-active rounded-lg transition-colors text-foreground"
          >
            Annuler
          </button>
          <button
            onClick={() => setStep('verify')}
            disabled={!qrCodeUrl}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  // Verification step
  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-2 text-foreground">
            🔢 Entrez le code de vérification
          </h3>
          <p className="text-sm text-foreground-muted">
            Entrez le code à 6 chiffres affiché dans votre application d&apos;authentification
          </p>
        </div>

        {/* Input code */}
        <div>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={verificationCode}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setVerificationCode(value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && verificationCode.length === 6) {
                verifyCode();
              }
            }}
            placeholder="000000"
            className="w-full px-4 py-3 text-center text-2xl font-mono rounded-lg border-2 border-border focus:border-primary focus:outline-none bg-white text-foreground"
            autoFocus
          />
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">⚠️ {error}</p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              setStep('qr');
              setVerificationCode('');
              setError('');
            }}
            className="flex-1 px-4 py-2 bg-surface-hover hover:bg-surface-active rounded-lg transition-colors text-foreground"
          >
            ← Retour
          </button>
          <button
            onClick={verifyCode}
            disabled={loading || verificationCode.length !== 6}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Vérification...
              </span>
            ) : (
              'Vérifier'
            )}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

