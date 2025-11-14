/**
 * CustomersSkeleton - Skeleton pour la page clients
 */

export default function CustomersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <div className="h-8 bg-surface-hover rounded w-64 mb-2"></div>
          <div className="h-4 bg-surface-hover rounded w-96"></div>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="liquid-glass p-4">
            <div className="h-4 bg-surface-hover rounded w-24 mb-2"></div>
            <div className="h-8 bg-surface-hover rounded w-16 mb-1"></div>
            <div className="h-3 bg-surface-hover rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="liquid-glass p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 h-10 bg-surface-hover rounded"></div>
          <div className="h-10 bg-surface-hover rounded w-32"></div>
          <div className="h-10 bg-surface-hover rounded w-40"></div>
        </div>
      </div>

      {/* Liste des clients */}
      <div className="liquid-glass p-6">
        <div className="h-6 bg-surface-hover rounded w-48 mb-6"></div>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-surface-hover rounded-lg">
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-surface-active shrink-0"></div>
              
              {/* Info */}
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-surface-active rounded w-40"></div>
                <div className="h-3 bg-surface-active rounded w-56"></div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex gap-6">
                <div className="text-center">
                  <div className="h-6 bg-surface-active rounded w-12 mb-1"></div>
                  <div className="h-3 bg-surface-active rounded w-16"></div>
                </div>
                <div className="text-center">
                  <div className="h-6 bg-surface-active rounded w-16 mb-1"></div>
                  <div className="h-3 bg-surface-active rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

