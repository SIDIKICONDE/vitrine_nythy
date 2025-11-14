'use client';

import {
  Bug,
  Database,
  Flag,
  Headphones,
  HelpCircle,
  Image as ImageIcon,
  LayoutDashboard,
  Lock,
  LogOut,
  Megaphone,
  Menu,
  MessageSquare,
  Palette,
  Shield,
  Star,
  Store,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactElement, ReactNode, useEffect, useState } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Utilisateurs', href: '/admin/users', icon: Users },
  { name: 'Commerces', href: '/admin/merchants', icon: Store },
  { name: 'Maintenance', href: '/admin/maintenance', icon: Wrench },
  { name: 'Recommandations', href: '/admin/recommendations', icon: Star },
  { name: 'Support', href: '/admin/support', icon: Headphones },
  { name: 'Annonces', href: '/admin/announcements', icon: Megaphone },
  { name: 'Signalements', href: '/admin/reports', icon: Flag },
  { name: 'FAQ', href: '/admin/faq', icon: HelpCircle },
  { name: 'Cache', href: '/admin/cache', icon: Database },
  { name: 'Erreurs', href: '/admin/errors', icon: Bug },
  { name: 'Sécurité', href: '/admin/security', icon: Lock },
  { name: 'Monitoring', href: '/admin/monitoring', icon: Shield },
  { name: 'Thèmes', href: '/admin/themes', icon: Palette },
  { name: 'Backgrounds', href: '/admin/backgrounds', icon: ImageIcon },
  { name: 'Messagerie', href: '/admin/messaging', icon: MessageSquare },
];

/**
 * Layout principal du dashboard d'administration
 */
export function AdminLayout({ children }: AdminLayoutProps): ReactElement {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Gérer le responsive : ouvrir le sidebar sur desktop, fermer sur mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    // Initialiser au chargement
    handleResize();

    // Écouter les changements de taille
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          shadow-xl lg:shadow-none
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <Link href="/admin" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-linear-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white">
              Admin
            </span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  // Fermer le sidebar sur mobile après clic
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                  ${isActive
                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-semibold shadow-sm'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium'
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={() => {
              // Logout logic
              window.location.href = '/api/auth/signout';
            }}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 font-medium"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="truncate">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'lg:ml-64' : 'ml-0'}
          min-h-screen
        `}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label={isSidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            <div className="flex items-center gap-2 sm:gap-4">
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Notifications"
              >
                <span className="relative">
                  🔔
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    3
                  </span>
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-label="Fermer le menu"
        />
      )}
    </div>
  );
}

