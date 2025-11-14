'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { AdminUser } from '@/types/admin';
import { Activity, Ban, Calendar, CheckCircle, Mail, Search, ShoppingBag, TrendingUp, User } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';

/**
 * Page de gestion des utilisateurs
 */
export default function AdminUsersPage(): ReactElement {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      console.log('📊 [Admin Users] Données récupérées:', {
        total: data.users?.length || 0,
        sample: data.users?.[0] || null
      });
      setUsers(data.users || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir bannir cet utilisateur ?')) {
      return;
    }

    try {
      await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
      });
      await loadUsers();
    } catch (error) {
      console.error('Erreur bannissement:', error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await fetch(`/api/admin/users/${userId}/unban`, {
        method: 'POST',
      });
      await loadUsers();
    } catch (error) {
      console.error('Erreur débannissement:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    // Les commerçants sont déjà exclus dans l'API
    // Filtres de recherche et statut uniquement
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'banned' && user.isBanned) ||
      (filterStatus === 'active' && !user.isBanned);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des Utilisateurs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {users.length} utilisateurs au total
          </p>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <ResponsiveGrid
            columns={{ initial: 1, sm: 2, lg: 3 }}
            gap={{ initial: 'sm', md: 'md' }}
          >
            {/* Recherche */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par email, nom, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filtre rôle */}
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="all">Tous les rôles</option>
              <option value="user">Utilisateur</option>
              <option value="admin">Admin</option>
            </select>

            {/* Filtre statut */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="banned">Bannis</option>
            </select>
          </ResponsiveGrid>
        </div>

        {/* Liste des utilisateurs */}
        {isLoading ? (
          <ResponsiveGrid columns={{ initial: 1 }} gap="sm">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </ResponsiveGrid>
        ) : (
          <ResponsiveGrid columns={{ initial: 1 }} gap="sm">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 hover:shadow-2xl hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Badge statut banni */}
                {user.isBanned && (
                  <div className="absolute top-4 right-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 shadow-sm">
                      <Ban className="w-3 h-3" />
                      Banni
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start gap-5">
                  {/* Avatar avec indicateur de rôle */}
                  <div className="relative shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || user.email}
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shadow-lg group-hover:scale-110 transition-transform duration-300 border-2 border-gray-200 dark:border-gray-700"
                        onError={(e) => {
                          // Fallback si l'image ne charge pas
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling;
                          if (fallback) {
                            (fallback as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-linear-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300 ${user.photoURL ? 'hidden' : ''}`}
                    >
                      {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    {/* Badge rôle sur l'avatar */}
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-md">
                      {user.role === 'admin' ? (
                        <span className="text-lg">👑</span>
                      ) : (
                        <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Informations principales */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Nom et rôle */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                          {user.displayName || user.email.split('@')[0] || 'Utilisateur'}
                        </h3>
                        <span
                          className={`
                            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm
                            ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}
                          `}
                        >
                          {user.role === 'admin' && '👑 '}
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </div>

                    {/* Statistiques en grille */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Commandes */}
                      <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingBag className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Commandes</span>
                        </div>
                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{user.totalOrders}</p>
                      </div>

                      {/* Dépenses */}
                      <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">Dépensé</span>
                        </div>
                        <p className="text-lg font-bold text-green-900 dark:text-green-100">{user.totalSpent.toFixed(0)} €</p>
                      </div>

                      {/* Inscription */}
                      <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800 col-span-2 sm:col-span-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Inscrit</span>
                        </div>
                        <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                          {new Date(user.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>

                      {/* Dernière activité */}
                      {user.lastActive && (
                        <div className="bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg p-3 border border-amber-100 dark:border-amber-800 col-span-2 sm:col-span-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Actif</span>
                          </div>
                          <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                            {new Date(user.lastActive).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: 'short'
                            })}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto">
                    {user.isBanned ? (
                      <button
                        onClick={() => handleUnbanUser(user.id)}
                        className="group/btn flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                        title="Débannir"
                      >
                        <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-sm">Débannir</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBanUser(user.id)}
                        className="group/btn flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-br from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                        title="Bannir"
                      >
                        <Ban className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-sm">Bannir</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredUsers.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                Aucun utilisateur trouvé
              </div>
            )}
          </ResponsiveGrid>
        )}
      </div>
    </AdminLayout>
  );
}

