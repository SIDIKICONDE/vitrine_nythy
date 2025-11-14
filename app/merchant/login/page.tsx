import MerchantLoginForm from '@/app/merchant/auth/MerchantLoginForm';

export const metadata = {
  title: 'Connexion - Espace Marchand',
};

export default function MerchantLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo */}
        <div className="text-center">
          <h2 className="text-4xl font-bold logo-nythy">
            Nythy
          </h2>
          <p className="mt-2 text-lg text-foreground-muted">
            Espace Marchand
          </p>
        </div>

        {/* Card */}
        <div className="liquid-glass shadow-custom-xl">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-foreground text-center">
              Connexion
            </h3>
            <p className="mt-2 text-sm text-foreground-muted text-center">
              Accédez à votre tableau de bord marchand
            </p>
          </div>

          <MerchantLoginForm />
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-foreground-subtle">
          © 2024 Nythy. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}

