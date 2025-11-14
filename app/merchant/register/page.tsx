import MerchantRegisterFormComplete from '@/app/merchant/auth/MerchantRegisterFormComplete';
import Link from 'next/link';

export const metadata = {
  title: 'Inscription - Espace Marchand',
  description: 'Rejoignez la communauté anti-gaspi Nythy et commencez à vendre vos produits',
};

export default function MerchantRegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl w-full">
        {/* Logo */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold logo-nythy">
            Nythy
          </h2>
          <p className="mt-2 text-lg text-foreground-muted">
            Rejoignez la communauté anti-gaspi
          </p>
        </div>

        {/* Card */}
        <div className="liquid-glass shadow-custom-xl">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-foreground text-center">
              Créer mon compte marchand
            </h3>
            <p className="mt-1 text-sm text-foreground-muted text-center">
              Complétez votre inscription en 3 étapes simples
            </p>
          </div>

          <MerchantRegisterFormComplete />

          <div className="mt-6 text-center border-t border-border pt-4">
            <p className="text-sm text-foreground-muted">
              Déjà un compte ?{' '}
              <Link
                href="/merchant/login"
                className="font-semibold text-primary hover:text-secondary transition-colors"
              >
                Connectez-vous
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-foreground-subtle">
          © 2024 Nythy. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}

