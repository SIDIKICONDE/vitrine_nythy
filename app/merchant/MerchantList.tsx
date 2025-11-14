/**
 * MerchantList - Liste de marchands avec filtres
 */

'use client';

import { useState } from 'react';
import { Merchant } from '@/types/merchant';
import { MerchantType } from '@/types/merchant-enums';
import MerchantCard from './MerchantCard';

interface MerchantListProps {
  merchants: Merchant[];
  showFilters?: boolean;
  showDistance?: boolean;
}

export default function MerchantList({ 
  merchants, 
  showFilters = true,
  showDistance = false 
}: MerchantListProps) {
  const [filteredMerchants, setFilteredMerchants] = useState(merchants);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<MerchantType | 'all'>('all');

  // Filtre des marchands
  const handleFilter = (query: string, type: MerchantType | 'all') => {
    let filtered = merchants;

    // Filtre par recherche
    if (query) {
      filtered = filtered.filter(m => 
        m.businessName.toLowerCase().includes(query.toLowerCase()) ||
        m.description?.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Filtre par type
    if (type !== 'all') {
      filtered = filtered.filter(m => m.merchantType === type);
    }

    setFilteredMerchants(filtered);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    handleFilter(query, selectedType);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as MerchantType | 'all';
    setSelectedType(type);
    handleFilter(searchQuery, type);
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      {showFilters && (
        <div className="liquid-glass p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recherche */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Rechercher
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Nom du commerce..."
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Type de commerce */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type de commerce
              </label>
              <select
                value={selectedType}
                onChange={handleTypeChange}
                className="w-full px-4 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Tous les types</option>
                {Object.values(MerchantType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Résultats */}
      <div>
        <p className="text-sm text-foreground-muted mb-4">
          {filteredMerchants.length} commerce{filteredMerchants.length > 1 ? 's' : ''} trouvé{filteredMerchants.length > 1 ? 's' : ''}
        </p>

        {filteredMerchants.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMerchants.map((merchant) => (
              <MerchantCard 
                key={merchant.id} 
                merchant={merchant}
                showDistance={showDistance}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 liquid-glass">
            <p className="text-lg text-foreground-muted">
              Aucun commerce trouvé
            </p>
            <p className="text-sm text-foreground-subtle mt-2">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

