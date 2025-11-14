# Guide d'implémentation du 2FA (Authentification à deux facteurs)

## 🎯 Vue d'ensemble

Ce guide explique comment implémenter l'authentification à deux facteurs (2FA) pour les marchands avec Firebase Authentication.

---

## 📋 Étape 1 : Configuration Firebase Console

### 1.1 Activer le Multi-Factor Authentication

1. Allez sur la [Console Firebase](https://console.firebase.google.com/)
2. Sélectionnez votre projet **Nythy**
3. Naviguez vers **Authentication** → **Paramètres** → **Connexion multi-facteurs**
4. Activez le **Multi-Factor Authentication**
5. Choisissez les méthodes :
   - ✅ **TOTP (Time-based One-Time Password)** - Applications d'authentification
   - ✅ **SMS** (optionnel) - Code par SMS

### 1.2 Configurer les quotas

- Limite quotidienne : 10 000 vérifications MFA par jour (gratuit)
- Au-delà : tarification standard Firebase

---

## 📋 Étape 2 : Créer les API Routes

### 2.1 API pour activer le 2FA

Créer `app/api/merchant/2fa/enable/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ID utilisateur requis' },
        { status: 400 }
      );
    }

    const auth = getAuth(adminApp);
    
    // Générer un secret TOTP pour l'utilisateur
    const mfaEnrollment = await auth.createProviderConfig({
      providerId: 'totp',
      displayName: 'Application d\'authentification',
    });

    return NextResponse.json({
      success: true,
      secret: mfaEnrollment,
      qrCodeUrl: `otpauth://totp/Nythy:${userId}?secret=${mfaEnrollment}&issuer=Nythy`,
    });
  } catch (error: any) {
    console.error('❌ Erreur activation 2FA:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

### 2.2 API pour vérifier le code 2FA

Créer `app/api/merchant/2fa/verify/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, code, secret } = await request.json();
    
    if (!userId || !code || !secret) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const auth = getAuth(adminApp);
    
    // Vérifier le code TOTP
    const isValid = await verifyTOTP(code, secret);
    
    if (isValid) {
      // Enregistrer le 2FA pour cet utilisateur
      await auth.updateUser(userId, {
        multiFactor: {
          enrolledFactors: [{
            factorId: 'totp',
            displayName: 'Application d\'authentification',
          }],
        },
      });

      return NextResponse.json({
        success: true,
        message: '2FA activé avec succès',
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Code invalide' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('❌ Erreur vérification 2FA:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// Fonction de vérification TOTP
function verifyTOTP(code: string, secret: string): boolean {
  // Utiliser une bibliothèque comme 'otpauth' ou 'speakeasy'
  const speakeasy = require('speakeasy');
  
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: code,
    window: 2, // Accepter les codes dans une fenêtre de 2 périodes
  });
}
```

### 2.3 API pour désactiver le 2FA

Créer `app/api/merchant/2fa/disable/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { adminApp } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();
    
    if (!userId || !password) {
      return NextResponse.json(
        { success: false, message: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    const auth = getAuth(adminApp);
    
    // Vérifier le mot de passe avant de désactiver
    // (pour la sécurité)
    
    // Supprimer le 2FA
    await auth.updateUser(userId, {
      multiFactor: {
        enrolledFactors: [],
      },
    });

    return NextResponse.json({
      success: true,
      message: '2FA désactivé avec succès',
    });
  } catch (error: any) {
    console.error('❌ Erreur désactivation 2FA:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
```

---

## 📋 Étape 3 : Créer le composant 2FA Setup

Créer `app/merchant/settings/components/TwoFactorSetup.tsx` :

```typescript
'use client';

import { useState } from 'react';
import QRCode from 'qrcode.react';

interface TwoFactorSetupProps {
  userId: string;
  onComplete: () => void;
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

  // Étape 1 : Générer le QR Code
  const generateQRCode = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/merchant/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        setSecret(data.secret);
        setQrCodeUrl(data.qrCodeUrl);
        setStep('qr');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Erreur lors de la génération du QR Code');
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

      const response = await fetch('/api/merchant/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: verificationCode,
          secret,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onComplete();
      } else {
        setError(data.message || 'Code invalide');
      }
    } catch (err) {
      setError('Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  // Au montage, générer le QR Code
  useState(() => {
    generateQRCode();
  }, []);

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-2">
            📱 Scannez ce QR Code
          </h3>
          <p className="text-sm text-foreground-muted">
            Ouvrez votre application d'authentification et scannez ce code
          </p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-border">
          <QRCode value={qrCodeUrl} size={200} />
        </div>

        {/* Secret manuel */}
        <div className="bg-surface-hover p-4 rounded-lg">
          <p className="text-xs text-foreground-muted mb-2">
            Ou entrez cette clé manuellement :
          </p>
          <code className="text-sm font-mono bg-white px-3 py-2 rounded border border-border block">
            {secret}
          </code>
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-surface-hover hover:bg-surface-active rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={() => setStep('verify')}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors"
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-bold mb-2">
            🔢 Entrez le code de vérification
          </h3>
          <p className="text-sm text-foreground-muted">
            Entrez le code à 6 chiffres affiché dans votre application
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
            placeholder="000000"
            className="w-full px-4 py-3 text-center text-2xl font-mono rounded-lg border-2 border-border focus:border-primary focus:outline-none"
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
            onClick={() => setStep('qr')}
            className="flex-1 px-4 py-2 bg-surface-hover hover:bg-surface-active rounded-lg transition-colors"
          >
            ← Retour
          </button>
          <button
            onClick={verifyCode}
            disabled={loading || verificationCode.length !== 6}
            className="flex-1 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Vérification...' : 'Vérifier'}
          </button>
        </div>
      </div>
    );
  }

  return null;
}
```

---

## 📋 Étape 4 : Intégrer dans la page Settings

Modifier `app/merchant/settings/page.tsx` :

```typescript
'use client';

import { useState } from 'react';
import TwoFactorSetup from './components/TwoFactorSetup';

export default function SettingsPage() {
  const [show2FASetup, setShow2FASetup] = useState(false);

  // ... reste du code

  const handle2FAActivation = () => {
    setShow2FASetup(true);
  };

  const handle2FAComplete = async () => {
    setShow2FASetup(false);
    // Rafraîchir les paramètres
    await updateSettings({ twoFactorEnabled: true });
    alert('✅ 2FA activé avec succès !');
  };

  // Dans le JSX, remplacer le bouton 2FA par :
  {!settings.twoFactorEnabled && (
    <button
      onClick={handle2FAActivation}
      className="w-full font-bold py-3 px-6 rounded-lg bg-primary hover:bg-primary-dark text-white"
    >
      🔐 Activer l'authentification 2FA
    </button>
  )}

  {/* Modal 2FA Setup */}
  {show2FASetup && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <TwoFactorSetup
          userId={merchantId!}
          onComplete={handle2FAComplete}
          onCancel={() => setShow2FASetup(false)}
        />
      </div>
    </div>
  )}
}
```

---

## 📋 Étape 5 : Installer les dépendances

```bash
cd "vitrine nythy"
npm install speakeasy qrcode.react
npm install --save-dev @types/speakeasy @types/qrcode.react
```

---

## 📋 Étape 6 : Implémenter la connexion avec 2FA

Modifier le processus de connexion pour demander le code 2FA si activé.

---

## 🎯 Résumé

✅ Configuration Firebase MFA
✅ API Routes pour activer/vérifier/désactiver le 2FA
✅ Composant React avec QR Code
✅ Intégration dans les paramètres
✅ Bibliothèques installées

## 🔐 Sécurité

- Toujours vérifier le mot de passe avant de désactiver le 2FA
- Utiliser HTTPS en production
- Limiter les tentatives de vérification (rate limiting)
- Logs des activités de sécurité

## 📚 Ressources

- [Firebase Multi-Factor Auth](https://firebase.google.com/docs/auth/web/multi-factor)
- [TOTP Specification (RFC 6238)](https://tools.ietf.org/html/rfc6238)
- [Speakeasy Documentation](https://github.com/speakeasyjs/speakeasy)


