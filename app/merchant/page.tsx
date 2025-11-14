import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';
import { redirect } from 'next/navigation';

// Rediriger automatiquement vers le dashboard ou login
export default async function MerchantPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/merchant/login');
  }

  // Vérifier si l'utilisateur est un admin
  const userId = (session.user as any).id;
  if (userId) {
    try {
      const userDoc = await adminDb.collection('users').doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        const role = userData?.['role'];

        // Si c'est un admin, rediriger vers la page admin
        if (role === 'admin') {
          console.log('🔄 [Merchant] Admin détecté, redirection vers /admin');
          redirect('/admin');
        }
      }
    } catch (error) {
      // Ne pas capturer NEXT_REDIRECT qui est l'exception normale de redirect()
      if ((error as any)?.message === 'NEXT_REDIRECT' || (error as any)?.digest?.startsWith('NEXT_REDIRECT')) {
        throw error;
      }
      console.error('❌ [Merchant] Erreur vérification rôle:', error);
    }
  }

  redirect('/merchant/dashboard');
}

