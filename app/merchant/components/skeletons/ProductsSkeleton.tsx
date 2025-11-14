/**
 * ProductsSkeleton - Skeleton pour la page produits
 */

export default function ProductsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header + Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="h-8 bg-surface-hover rounded w-64 mb-2"></div>
          <div className="h-4 bg-surface-hover rounded w-96"></div>
        </div>
        <div className="h-10 bg-surface-hover rounded w-48"></div>
      </div>

      {/* Filtres */}
      <div className="liquid-glass p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Barre de recherche */}
          <div className="flex-1 h-10 bg-surface-hover rounded"></div>
          {/* Catégories */}
          <div className="h-10 bg-surface-hover rounded w-48"></div>
          {/* Toggle actifs */}
          <div className="h-10 bg-surface-hover rounded w-32"></div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="liquid-glass p-4">
            <div className="h-4 bg-surface-hover rounded w-20 mb-2"></div>
            <div className="h-8 bg-surface-hover rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Grille de produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="liquid-glass overflow-hidden">
            {/* Image */}
            <div className="h-48 bg-surface-hover"></div>
            
            {/* Contenu */}
            <div className="p-4 space-y-3">
              {/* Badge + Statut */}
              <div className="flex justify-between items-center">
                <div className="h-6 bg-surface-hover rounded w-20"></div>
                <div className="h-6 bg-surface-hover rounded w-24"></div>
              </div>

              {/* Titre */}
              <div className="h-6 bg-surface-hover rounded w-full"></div>

              {/* Description */}
              <div className="space-y-2">
                <div className="h-3 bg-surface-hover rounded w-full"></div>
                <div className="h-3 bg-surface-hover rounded w-3/4"></div>
              </div>

              {/* Prix */}
              <div className="flex items-center gap-2">
                <div className="h-8 bg-surface-hover rounded w-20"></div>
                <div className="h-5 bg-surface-hover rounded w-16"></div>
              </div>

              {/* Infos supplémentaires */}
              <div className="flex gap-2">
                <div className="h-6 bg-surface-hover rounded w-16"></div>
                <div className="h-6 bg-surface-hover rounded w-20"></div>
                <div className="h-6 bg-surface-hover rounded w-24"></div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <div className="flex-1 h-9 bg-surface-hover rounded"></div>
                <div className="flex-1 h-9 bg-surface-hover rounded"></div>
                <div className="h-9 w-9 bg-surface-hover rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

