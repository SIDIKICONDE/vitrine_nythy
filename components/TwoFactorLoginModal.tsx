/**
 * TwoFactorLoginModal - Modal pour la vérification 2FA lors de la connexion
 * À intégrer dans le flux de connexion quand 2FA est activé
 */

'use client';

import { useState } from 'react';

interface TwoFactorLoginModalProps {
  email: string;
  onVerify: (code: string, useRecoveryCode: boolean) => Promise<void>;
  onCancel: () => void;
}

export default function TwoFactorLoginModal({
  email,
  onVerify,
  onCancel,
}: TwoFactorLoginModalProps) {
  const [code, setCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!useRecoveryCode && code.length !== 6) {
      setError('Le code doit contenir 6 chiffres');
      return;
    }

    if (useRecoveryCode && code.length < 8) {
      setError('Format de code de récupération invalide');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await onVerify(useRecoveryCode ? code.replace('-', '') : code, useRecoveryCode);
    } catch (err) {
      console.error('❌ Erreur vérification 2FA:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-2xl">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold mb-2 text-foreground">
              🔐 Authentification à deux facteurs
            </h3>
            <p className="text-sm text-foreground-muted">
              {useRecoveryCode
                ? 'Entrez un code de récupération'
                : `Entrez le code à 6 chiffres de votre application d'authentification`}
            </p>
            <p className="text-xs text-foreground-muted mt-1">
              Compte : <strong>{email}</strong>
            </p>
          </div>

          {/* Input code */}
          <div>
            <input
              type="text"
              inputMode={useRecoveryCode ? 'text' : 'numeric'}
              maxLength={useRecoveryCode ? 9 : 6} // 9 pour inclure le tiret
              value={code}
              onChange={(e) => {
                let value = e.target.value;
                if (!useRecoveryCode) {
                  value = value.replace(/\D/g, '');
                } else {
                  value = value.toUpperCase();
                }
                setCode(value);
                setError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVerify();
                }
              }}
              placeholder={useRecoveryCode ? 'XXXX-XXXX' : '000000'}
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

          {/* Bouton : Utiliser un code de récupération */}
          <button
            type="button"
            onClick={() => {
              setUseRecoveryCode(!useRecoveryCode);
              setCode('');
              setError('');
            }}
            className="w-full text-sm text-primary hover:underline"
          >
            {useRecoveryCode
              ? '← Utiliser un code d\'authentification'
              : 'Utiliser un code de récupération →'}
          </button>

          {/* Boutons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 bg-surface-hover hover:bg-surface-active rounded-lg transition-colors text-foreground"
            >
              Annuler
            </button>
            <button
              onClick={handleVerify}
              disabled={loading || code.length === 0}
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
      </div>
    </div>
  );
}

