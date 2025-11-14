'use client';

import { signOut } from 'next-auth/react';

/**
 * Bouton de déconnexion
 */
export function SignOutButton() {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
    >
      Déconnexion
    </button>
  );
}

