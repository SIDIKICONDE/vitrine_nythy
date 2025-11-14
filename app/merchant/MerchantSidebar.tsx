/**
 * MerchantSidebar - Sidebar de navigation pour l'espace marchand
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useNotifications } from './hooks/useNotifications';

interface NavItem {
  icon: string;
  label: string;
  href: string;
  badgeKey?: 'orders' | 'reviews' | 'products';
}

const navItems: NavItem[] = [
  { icon: '📊', label: 'Dashboard', href: '/merchant/dashboard' },
  { icon: '📦', label: 'Produits', href: '/merchant/products', badgeKey: 'products' },
  { icon: '🛒', label: 'Commandes', href: '/merchant/orders', badgeKey: 'orders' },
  { icon: '⭐', label: 'Avis', href: '/merchant/reviews', badgeKey: 'reviews' },
  { icon: '👥', label: 'Clients', href: '/merchant/customers' },
  { icon: '💰', label: 'Finances', href: '/merchant/finances' },
  { icon: '📈', label: 'Statistiques', href: '/merchant/stats' },
  { icon: '⚙️', label: 'Paramètres', href: '/merchant/settings' },
];

export default function MerchantSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { notifications } = useNotifications();

  const isActive = (href: string) => {
    if (href === '/merchant/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Sidebar Desktop */}
      <aside
        className={`
          hidden lg:block sticky top-[73px] h-[calc(100vh-73px)] 
          bg-surface border-r border-border transition-all duration-300
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Toggle button */}
          <div className="p-4 border-b border-border">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-surface-hover transition-colors"
              title={isCollapsed ? 'Étendre' : 'Réduire'}
            >
              <span className="text-xl">
                {isCollapsed ? '→' : '←'}
              </span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${isActive(item.href)
                        ? 'bg-primary text-white'
                        : 'text-foreground hover:bg-surface-hover'
                      }
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="text-xl shrink-0">{item.icon}</span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 font-medium">{item.label}</span>
                        {item.badgeKey && notifications[item.badgeKey] > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {notifications[item.badgeKey]}
                          </span>
                        )}
                      </>
                    )}
                    {isCollapsed && item.badgeKey && notifications[item.badgeKey] > 0 && (
                      <span className="absolute right-2 top-2 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Quick action */}
          {!isCollapsed && (
            <div className="p-4 border-t border-border">
              <Link
                href="/merchant/products/new"
                className="block w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-lg transition-colors text-center"
              >
                ➕ Nouveau produit
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar Mobile (Bottom Navigation) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors relative
                ${isActive(item.href)
                  ? 'bg-primary text-white'
                  : 'text-foreground hover:bg-surface-hover'
                }
              `}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs font-medium truncate w-full text-center">
                {item.label}
              </span>
              {item.badgeKey && notifications[item.badgeKey] > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {notifications[item.badgeKey]}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Spacer for mobile bottom nav */}
      <div className="lg:hidden h-20"></div>
    </>
  );
}

