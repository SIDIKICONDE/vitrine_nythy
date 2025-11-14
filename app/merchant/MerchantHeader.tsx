/**
 * MerchantHeader - Header de l'espace marchand
 * 
 * ✅ Récupère automatiquement les données réelles du marchand
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useNotifications } from './hooks/useNotifications';

interface MerchantHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface MerchantData {
  name: string;
  email: string;
  image: string | null;
}

export default function MerchantHeader({ user: userProp }: MerchantHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [merchantData, setMerchantData] = useState<MerchantData | null>(null);
  const { totalCount } = useNotifications();

  // Récupérer les vraies données du marchand
  useEffect(() => {
    // Si on a déjà les données en props, les utiliser
    if (userProp) {
      setMerchantData({
        name: userProp.name || 'Marchand',
        email: userProp.email || '',
        image: userProp.image || null,
      });
      return;
    }

    // Sinon, charger depuis l'API
    const fetchMerchantData = async () => {
      try {
        const response = await fetch('/api/merchant/me');
        const result = await response.json();

        if (response.ok && result.success) {
          const merchant = result.merchant;
          setMerchantData({
            name: merchant.business_name || merchant.name || 'Marchand',
            email: merchant.email || merchant.contact_email || '',
            image: merchant.logo || merchant.logo_url || null,
          });
        }
      } catch (error) {
        console.error('Erreur chargement données marchand:', error);
      }
    };

    fetchMerchantData();
  }, [userProp]);

  // Utiliser les données chargées ou un fallback
  const user = merchantData || {
    name: 'Marchand',
    email: '',
    image: null,
  };

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-border shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center gap-4">
            <Link href="/merchant/dashboard" className="flex items-center gap-3">
              <div className="text-3xl font-bold logo-nythy">
                Nythy
              </div>
              <div className="hidden md:block h-8 w-px bg-border"></div>
              <div className="hidden md:block">
                <span className="text-sm font-medium text-foreground-muted">
                  Espace Marchand
                </span>
              </div>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Notifications - Affiche le nombre total de notifications */}
            <button
              className="relative p-2 rounded-lg hover:bg-surface-hover transition-colors"
              title={totalCount > 0 ? `${totalCount} nouvelle${totalCount > 1 ? 's' : ''} notification${totalCount > 1 ? 's' : ''}` : 'Aucune notification'}
            >
              <span className="text-xl">🔔</span>
              {/* Badge notification avec le nombre */}
              {totalCount > 0 && (
                <>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {totalCount > 9 ? (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full min-w-[18px] text-center">
                      9+
                    </span>
                  ) : (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 rounded-full min-w-[18px] text-center">
                      {totalCount}
                    </span>
                  )}
                </>
              )}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-hover transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white font-bold overflow-hidden">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name || 'User'}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{user.name?.[0]?.toUpperCase() || '👤'}</span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground">
                    {user.name || 'Marchand'}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {user.email}
                  </p>
                </div>
                <span className="text-foreground-muted">▼</span>
              </button>

              {/* Dropdown menu */}
              {showUserMenu && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  ></div>

                  {/* Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-lg py-2 z-50">
                    <Link
                      href="/merchant/profile"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span>⚙️</span>
                      <span>Mon profil</span>
                    </Link>
                    <Link
                      href="/merchant/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span>🔧</span>
                      <span>Paramètres</span>
                    </Link>
                    <Link
                      href="/merchant/stats"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span>📊</span>
                      <span>Statistiques</span>
                    </Link>
                    <div className="my-2 border-t border-border"></div>
                    <Link
                      href="/merchant/help"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-surface-hover transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span>❓</span>
                      <span>Centre d'aide</span>
                    </Link>
                    <div className="my-2 border-t border-border"></div>
                    <form action="/api/auth/signout" method="POST">
                      <button
                        type="submit"
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <span>🚪</span>
                        <span>Déconnexion</span>
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

