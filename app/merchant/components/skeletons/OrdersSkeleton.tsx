/**
 * Skeleton de chargement pour la page des commandes
 */

export default function OrdersSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-surface-hover rounded w-64"></div>
          <div className="h-4 bg-surface-hover rounded w-96"></div>
        </div>
        <div className="h-12 bg-surface-hover rounded w-20"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="liquid-glass p-4">
            <div className="h-4 bg-surface-hover rounded w-24 mb-2"></div>
            <div className="h-8 bg-surface-hover rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-surface-hover rounded w-24"></div>
        ))}
      </div>

      {/* Orders List Skeleton */}
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="liquid-glass p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-6 bg-surface-hover rounded w-32"></div>
                <div className="h-6 bg-surface-hover rounded w-20"></div>
                <div className="h-4 bg-surface-hover rounded w-24"></div>
              </div>
              <div className="h-6 bg-surface-hover rounded w-20"></div>
            </div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-4">
                <div className="h-4 bg-surface-hover rounded w-32"></div>
                <div className="h-4 bg-surface-hover rounded w-24"></div>
              </div>
              <div className="h-6 bg-surface-hover rounded w-28"></div>
            </div>
            <div className="flex gap-1.5">
              <div className="h-8 bg-surface-hover rounded flex-1"></div>
              <div className="h-8 bg-surface-hover rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

