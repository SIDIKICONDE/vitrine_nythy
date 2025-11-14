/**
 * Page de gestion des clients
 */

'use client';

import MerchantHeader from '@/app/merchant/MerchantHeader';
import MerchantSidebar from '@/app/merchant/MerchantSidebar';
import CustomersSkeleton from '@/app/merchant/components/skeletons/CustomersSkeleton';
import apiCustomerRepository from '@/app/merchant/infrastructure/api/ApiCustomerRepository';
import { useEffect, useMemo, useState } from 'react';

interface Customer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  completedOrders?: number;
  totalSpent: number;
  lastOrderDate: Date | string;
  firstOrderDate?: Date | string;
  isVIP: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [merchantData, setMerchantData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'orders' | 'spent' | 'recent'>('recent');
  const [filterVIP, setFilterVIP] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Charger les clients depuis l'API
    const fetchCustomers = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Récupérer le merchantId et les données du marchand
        const merchantResponse = await fetch('/api/merchant/me');
        const merchantResult = await merchantResponse.json();

        if (!merchantResponse.ok || !merchantResult.success) {
          throw new Error(merchantResult.message || 'Erreur lors de la récupération du commerce');
        }

        const merchantId = merchantResult.merchant.id;

        // Extraire les données du marchand
        const merchant = merchantResult.merchant;
        setMerchantData({
          name: merchant.business_name || merchant.name || 'Commerce',
          email: merchant.email || merchant.contact_email || '',
          image: merchant.logo || merchant.logo_url || null,
        });

        // 2. Récupérer les clients
        const customersData = await apiCustomerRepository.getCustomers(merchantId);

        // Convertir les dates string en Date pour le tri
        const customersWithDates = customersData.map(customer => ({
          ...customer,
          lastOrderDate: new Date(customer.lastOrderDate),
          firstOrderDate: new Date(customer.firstOrderDate),
        }));

        setCustomers(customersWithDates as any);
      } catch (err) {
        console.error('Erreur lors du chargement des clients:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Utilisateur par défaut (fallback)
  const defaultUser = {
    name: 'Commerce',
    email: '',
    image: null,
  };

  const displayUser = merchantData || defaultUser;

  // Calcul des stats
  const stats = useMemo(() => {
    return {
      total: customers.length,
      vip: customers.filter(c => c.isVIP).length,
      totalRevenue: customers.reduce((sum, c) => sum + c.totalSpent, 0),
      avgOrderValue: customers.length > 0
        ? customers.reduce((sum, c) => sum + c.totalSpent, 0) / customers.reduce((sum, c) => sum + c.totalOrders, 0)
        : 0,
    };
  }, [customers]);

  // Filtrage et tri
  const filteredCustomers = useMemo(() => {
    let filtered = customers.filter(customer => {
      const matchSearch = searchQuery === '' ||
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchVIP = !filterVIP || customer.isVIP;

      return matchSearch && matchVIP;
    });

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'orders':
          return b.totalOrders - a.totalOrders;
        case 'spent':
          return b.totalSpent - a.totalSpent;
        case 'recent':
        default:
          const dateA = typeof a.lastOrderDate === 'string' ? new Date(a.lastOrderDate) : a.lastOrderDate;
          const dateB = typeof b.lastOrderDate === 'string' ? new Date(b.lastOrderDate) : b.lastOrderDate;
          return dateB.getTime() - dateA.getTime();
      }
    });

    return filtered;
  }, [customers, searchQuery, sortBy, filterVIP]);

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8 lg:pb-8 pb-24">
            <div className="max-w-7xl mx-auto">
              <CustomersSkeleton />
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface">
        <MerchantHeader user={displayUser} />
        <div className="flex">
          <MerchantSidebar />
          <main className="flex-1 p-8 lg:pb-8 pb-24">
            <div className="max-w-7xl mx-auto">
              <div className="liquid-glass p-6 text-center">
                <p className="text-error text-lg">❌ {error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <MerchantHeader user={displayUser} />
      <div className="flex">
        <MerchantSidebar />
        <main className="flex-1 p-8 lg:pb-8 pb-24">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                👥 Clients
              </h1>
              <p className="text-foreground-muted mt-2">
                Gérez vos clients et suivez leur activité
              </p>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="liquid-glass p-4">
                <p className="text-sm text-foreground-muted mb-1">Total clients</p>
                <p className="text-3xl font-bold text-foreground mb-1">{stats.total}</p>
                <p className="text-xs text-success">+{stats.vip} VIP</p>
              </div>
              <div className="liquid-glass p-4">
                <p className="text-sm text-foreground-muted mb-1">Clients VIP</p>
                <p className="text-3xl font-bold text-foreground mb-1">{stats.vip}</p>
                <p className="text-xs text-foreground-muted">{Math.round((stats.vip / stats.total) * 100)}% des clients</p>
              </div>
              <div className="liquid-glass p-4">
                <p className="text-sm text-foreground-muted mb-1">Revenu total</p>
                <p className="text-3xl font-bold text-foreground mb-1">{stats.totalRevenue.toFixed(2)}€</p>
                <p className="text-xs text-foreground-muted">Depuis le début</p>
              </div>
              <div className="liquid-glass p-4">
                <p className="text-sm text-foreground-muted mb-1">Panier moyen</p>
                <p className="text-3xl font-bold text-foreground mb-1">{stats.avgOrderValue.toFixed(2)}€</p>
                <p className="text-xs text-foreground-muted">Par commande</p>
              </div>
            </div>

            {/* Filtres */}
            <div className="liquid-glass p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Recherche */}
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un client..."
                    className="w-full px-4 py-2 pl-10 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
                    🔍
                  </span>
                </div>

                {/* Filtre VIP */}
                <button
                  onClick={() => setFilterVIP(!filterVIP)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterVIP
                    ? 'bg-primary text-white'
                    : 'bg-surface-hover text-foreground hover:bg-surface-active'
                    }`}
                >
                  ⭐ VIP uniquement
                </button>

                {/* Tri */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="recent">Plus récents</option>
                  <option value="name">Nom (A-Z)</option>
                  <option value="orders">Plus de commandes</option>
                  <option value="spent">Plus de dépenses</option>
                </select>
              </div>
            </div>

            {/* Liste des clients */}
            <div className="liquid-glass p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                {filteredCustomers.length} client{filteredCustomers.length > 1 ? 's' : ''}
              </h2>

              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-lg text-foreground-muted">
                    Aucun client trouvé
                  </p>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                  <div className="divide-y divide-border">
                    {filteredCustomers.map((customer, index) => (
                      <div
                        key={customer.id || `customer-${index}`}
                        className="flex items-center gap-4 p-4 hover:bg-surface-hover rounded-lg transition-colors"
                      >
                        {/* Avatar */}
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xl font-bold text-primary">
                            {customer.name.charAt(0)}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground truncate">
                              {customer.name}
                            </h3>
                            {customer.isVIP && (
                              <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full shrink-0">
                                ⭐ VIP
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground-muted mt-1">
                            Dernière commande: {formatDate(customer.lastOrderDate)}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="hidden md:flex gap-6 shrink-0">
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground">
                              {customer.totalOrders}
                            </p>
                            <p className="text-xs text-foreground-muted">Commandes</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold text-foreground">
                              {customer.totalSpent.toFixed(2)}€
                            </p>
                            <p className="text-xs text-foreground-muted">Total</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}

