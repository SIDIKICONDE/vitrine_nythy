'use client';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { ResponsiveGrid } from '@/components/layout/ResponsiveGrid';
import { AdminMerchant } from '@/types/admin';
import { Calendar, CheckCircle, MapPin, Package, RefreshCw, Search, ShoppingBag, Star, Store, XCircle } from 'lucide-react';
import { ReactElement, useEffect, useState } from 'react';

/**
 * Page de gestion des commerces
 */
export default function AdminMerchantsPage(): ReactElement {
  const [merchants, setMerchants] = useState<AdminMerchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterVerified, setFilterVerified] = useState<string>('all');

  useEffect(() => {
    loadMerchants();
  }, []);

  const loadMerchants = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 [Admin Merchants] Chargement des commerces...');
      const response = await fetch('/api/admin/merchants');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📊 [Admin Merchants] Données récupérées:', {
        total: data.merchants?.length || 0,
        sample: data.merchants?.[0] || null
      });
      setMerchants(data.merchants || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ [Admin Merchants] Erreur chargement commerces:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMerchant = async (merchantId: string) => {
    try {
      await fetch(`/api/admin/merchants/${merchantId}/verify`, {
        method: 'POST',
      });
      await loadMerchants();
    } catch (error) {
      console.error('Erreur vérification:', error);
    }
  };

  const handleSuspendMerchant = async (merchantId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir suspendre ce commerce ?')) {
      return;
    }

    try {
      await fetch(`/api/admin/merchants/${merchantId}/suspend`, {
        method: 'POST',
      });
      await loadMerchants();
    } catch (error) {
      console.error('Erreur suspension:', error);
    }
  };

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch =
      merchant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      merchant.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || merchant.status === filterStatus;
    const matchesVerified =
      filterVerified === 'all' ||
      (filterVerified === 'verified' && merchant.isVerified) ||
      (filterVerified === 'unverified' && !merchant.isVerified);

    return matchesSearch && matchesStatus && matchesVerified;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Gestion des Commerces
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {merchants.length} commerces au total
            </p>
          </div>
          <button
            onClick={loadMerchants}
            disabled={isLoading}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all hover:shadow-lg flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>

        {/* Affichage erreur si nécessaire */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-700 dark:text-red-300 font-medium">
              ❌ {error}
            </p>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <ResponsiveGrid columns={{ initial: 1, sm: 2, lg: 3 }} gap={{ initial: 'sm', md: 'md' }}>
            {/* Recherche */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Filtre statut */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="active">Actif</option>
              <option value="suspended">Suspendu</option>
            </select>

            {/* Filtre vérification */}
            <select
              value={filterVerified}
              onChange={(e) => setFilterVerified(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            >
              <option value="all">Toutes les vérifications</option>
              <option value="verified">Vérifiés</option>
              <option value="unverified">Non vérifiés</option>
            </select>
          </ResponsiveGrid>
        </div>

        {/* Liste des commerces */}
        {isLoading ? (
          <ResponsiveGrid columns={{ initial: 1 }} gap="sm">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
            ))}
          </ResponsiveGrid>
        ) : (
          <ResponsiveGrid columns={{ initial: 1 }} gap="sm">
            {filteredMerchants.map((merchant) => (
              <div
                key={merchant.id}
                className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 hover:shadow-2xl hover:border-amber-300 dark:hover:border-amber-600 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  {/* Logo avec indicateurs */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-linear-to-br from-amber-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden shadow-lg group-hover:scale-110 transition-transform duration-300 border-2 border-gray-200 dark:border-gray-700">
                      {merchant.logoUrl ? (
                        <img
                          src={merchant.logoUrl}
                          alt={merchant.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        merchant.name?.[0]?.toUpperCase() || 'M'
                      )}
                    </div>
                    {/* Badge vérification */}
                    {merchant.isVerified && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 flex items-center justify-center shadow-md">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Informations */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Nom et badges */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                          {merchant.name}
                        </h3>

                        <span
                          className={`
                            inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shadow-sm
                            ${merchant.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : ''}
                            ${merchant.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : ''}
                            ${merchant.status === 'suspended' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' : ''}
                          `}
                        >
                          {merchant.status === 'active' && '✓ Actif'}
                          {merchant.status === 'pending' && '⏳ En attente'}
                          {merchant.status === 'suspended' && '⚠️ Suspendu'}
                        </span>

                        {merchant.hasSvgLogo && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 whitespace-nowrap shadow-sm">
                            🎨 SVG
                          </span>
                        )}
                      </div>

                      {/* Catégorie et localisation */}
                      <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4 shrink-0" />
                          <span>{merchant.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span className="truncate">{merchant.address}, {merchant.city}</span>
                        </div>
                      </div>
                    </div>

                    {/* Statistiques en grille */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Note */}
                      <div className="bg-linear-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-lg p-3 border border-yellow-100 dark:border-yellow-800">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Note</span>
                        </div>
                        <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">{merchant.rating.toFixed(1)}</p>
                      </div>

                      {/* Offres */}
                      <div className="bg-linear-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-3 border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-1">
                          <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Offres</span>
                        </div>
                        <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{merchant.totalOffers}</p>
                      </div>

                      {/* Commandes */}
                      <div className="bg-linear-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-1">
                          <ShoppingBag className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">Commandes</span>
                        </div>
                        <p className="text-xl font-bold text-green-900 dark:text-green-100">{merchant.totalOrders}</p>
                      </div>

                      {/* Inscription */}
                      <div className="bg-linear-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Inscrit</span>
                        </div>
                        <p className="text-sm font-bold text-purple-900 dark:text-purple-100">
                          {new Date(merchant.createdAt).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto">
                    {!merchant.isVerified && merchant.status === 'pending' && (
                      <button
                        onClick={() => handleVerifyMerchant(merchant.id)}
                        className="group/btn flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-br from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                        title="Vérifier"
                      >
                        <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-sm">Vérifier</span>
                      </button>
                    )}

                    {merchant.status !== 'suspended' && (
                      <button
                        onClick={() => handleSuspendMerchant(merchant.id)}
                        className="group/btn flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-linear-to-br from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
                        title="Suspendre"
                      >
                        <XCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                        <span className="text-sm">Suspendre</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredMerchants.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
                Aucun commerce trouvé
              </div>
            )}
          </ResponsiveGrid>
        )}
      </div>
    </AdminLayout>
  );
}

