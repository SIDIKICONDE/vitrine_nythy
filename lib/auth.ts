import { getAuth } from 'firebase-admin/auth';
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
// Importer firebase-admin pour s'assurer que l'app est initialisée
import '@/lib/firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { hashRecoveryCode } from '@/lib/two-factor';
import * as speakeasy from 'speakeasy';

/**
 * Configuration NextAuth avec Firebase Admin Auth
 * 
 * ⚠️ MODE DÉVELOPPEMENT : Vérification simplifiée sans AppCheck
 * ⚠️ EN PRODUCTION : Configurer reCAPTCHA Enterprise + AppCheck dans Firebase Console
 * 
 * Pour activer AppCheck en production :
 * 1. Firebase Console → App Check → Configurer reCAPTCHA Enterprise
 * 2. Ajouter votre domaine dans Google reCAPTCHA Admin
 * 3. Mettre NODE_ENV=production
 */

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          console.log('🔐 Tentative de connexion avec:', credentials.email);

          const adminAuth = getAuth();
          const isDevelopment = process.env.NODE_ENV === 'development';

          // Vérifier que l'utilisateur existe
          let userRecord;
          try {
            userRecord = await adminAuth.getUserByEmail(credentials.email as string);
          } catch (error: any) {
            console.error('❌ Utilisateur non trouvé:', credentials.email);
            return null;
          }

          const userDoc = await adminDb.collection('users').doc(userRecord.uid).get();
          const userData = userDoc.data();

          // En développement : mode permissif pour tester sans AppCheck
          if (isDevelopment) {
            console.log('🔧 [DEV] Mode développement - vérification simplifiée');

            // En dev, on accepte si le mot de passe fait au moins 12 caractères
            // ATTENTION : NE PAS utiliser en production !
            if ((credentials.password as string).length >= 12) {
              console.log('✅ [DEV] Connexion autorisée (mode dev):', credentials.email);
              return {
                id: userRecord.uid,
                email: userRecord.email || credentials.email,
                name: userRecord.displayName || userRecord.email,
              };
            } else {
              console.error('❌ [DEV] Mot de passe trop court');
              return null;
            }
          }

          // En production : vérification complète avec l'API Firebase
          const apiKey = process.env['NEXT_PUBLIC_FIREBASE_API_KEY'];
          const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
                returnSecureToken: true,
              }),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Erreur authentification:', errorData.error?.message);
            return null;
          }

          const data = await response.json();

          if (data.localId) {
            const twoFactorCode = (credentials as any).twoFactorCode as string | undefined;
            const twoFactorUseRecovery = !!(credentials as any).twoFactorUseRecovery;
            const is2FAEnabled = userData?.['2fa_enabled'] === true;
            const twoFactorSecret = userData?.['2fa_secret'];

            if (is2FAEnabled) {
              if (!twoFactorCode) {
                await adminDb.collection('security_logs').add({
                  type: '2fa_login_required',
                  userId: userRecord.uid,
                  email: credentials.email,
                  timestamp: new Date().toISOString(),
                });
                throw new Error('2FA_REQUIRED');
              }

              let verified = false;

              if (twoFactorUseRecovery) {
                const normalized = twoFactorCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
                const recoveryCodes = Array.isArray(userData?.['2fa_recovery_codes'])
                  ? [...(userData['2fa_recovery_codes'] as any[])]
                  : [];
                const codeHash = hashRecoveryCode(normalized);
                const idx = recoveryCodes.findIndex(
                  (rc: any) => rc.hash === codeHash && !rc.used
                );

                if (idx !== -1) {
                  recoveryCodes[idx] = {
                    ...recoveryCodes[idx],
                    used: true,
                    usedAt: new Date().toISOString(),
                  };

                  await adminDb.collection('users').doc(userRecord.uid).update({
                    '2fa_recovery_codes': recoveryCodes,
                    updatedAt: new Date().toISOString(),
                  });

                  verified = true;
                }
              } else if (twoFactorSecret) {
                verified = speakeasy.totp.verify({
                  secret: twoFactorSecret,
                  encoding: 'base32',
                  token: twoFactorCode,
                  window: 2,
                });
              }

              if (!verified) {
                await adminDb.collection('security_logs').add({
                  type: '2fa_login_failed',
                  userId: userRecord.uid,
                  email: credentials.email,
                  timestamp: new Date().toISOString(),
                });
                throw new Error('2FA_INVALID_CODE');
              }

              await adminDb.collection('security_logs').add({
                type: '2fa_login_success',
                userId: userRecord.uid,
                email: credentials.email,
                timestamp: new Date().toISOString(),
              });
            }

            console.log('✅ Connexion réussie:', credentials.email);
            return {
              id: data.localId,
              email: data.email,
              name: userRecord.displayName || data.email,
            };
          }

          return null;
        } catch (error: any) {
          console.error('❌ Erreur d\'authentification Firebase:', {
            code: error.code,
            message: error.message,
            email: credentials.email,
          });
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/merchant/login',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token['id'] = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token['id'];
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true, // Nécessaire pour NextAuth en développement
});

