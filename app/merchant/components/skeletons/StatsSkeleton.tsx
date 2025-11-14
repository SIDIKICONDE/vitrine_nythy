/**
 * Skeleton de chargement pour la page des statistiques
 */

export default function StatsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-surface-hover rounded w-64"></div>
          <div className="h-4 bg-surface-hover rounded w-96"></div>
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-surface-hover rounded w-24"></div>
          ))}
        </div>
      </div>

      {/* Sales Stats Section Skeleton */}
      <div>
        <div className="h-6 bg-surface-hover rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="liquid-glass p-6">
              <div className="h-4 bg-surface-hover rounded w-32 mb-3"></div>
              <div className="h-10 bg-surface-hover rounded w-24 mb-2"></div>
              <div className="h-3 bg-surface-hover rounded w-20"></div>
            </div>
          ))}
        </div>

        {/* Chart Skeleton */}
        <div className="liquid-glass p-6">
          <div className="h-6 bg-surface-hover rounded w-40 mb-6"></div>
          <div className="h-64 bg-surface-hover rounded"></div>
        </div>
      </div>

      {/* Customer Stats Section Skeleton */}
      <div>
        <div className="h-6 bg-surface-hover rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="liquid-glass p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-surface-hover rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-8 bg-surface-hover rounded w-20"></div>
                  <div className="h-3 bg-surface-hover rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Impact Stats Section Skeleton */}
      <div>
        <div className="h-6 bg-surface-hover rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="liquid-glass p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-surface-hover rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-8 bg-surface-hover rounded w-24"></div>
                  <div className="h-3 bg-surface-hover rounded w-32"></div>
                </div>
              </div>
              <div className="h-3 bg-surface-hover rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Card Skeleton */}
      <div className="liquid-glass p-6">
        <div className="h-5 bg-surface-hover rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-surface-hover rounded w-32"></div>
              <div className="h-6 bg-surface-hover rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

