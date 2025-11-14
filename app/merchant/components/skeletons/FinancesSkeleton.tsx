/**
 * Skeleton de chargement pour la page des finances
 */

export default function FinancesSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 bg-surface-hover rounded w-64"></div>
          <div className="h-4 bg-surface-hover rounded w-96"></div>
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-surface-hover rounded w-20"></div>
          ))}
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="liquid-glass p-6">
            <div className="h-4 bg-surface-hover rounded w-32 mb-3"></div>
            <div className="h-10 bg-surface-hover rounded w-24 mb-2"></div>
            <div className="h-3 bg-surface-hover rounded w-20"></div>
          </div>
        ))}
      </div>

      {/* Transactions & Payouts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transactions */}
        <div className="liquid-glass p-6">
          <div className="h-6 bg-surface-hover rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface-hover rounded">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-surface-active rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-surface-active rounded w-32"></div>
                    <div className="h-3 bg-surface-active rounded w-24"></div>
                  </div>
                </div>
                <div className="h-5 bg-surface-active rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Payouts */}
        <div className="liquid-glass p-6">
          <div className="h-6 bg-surface-hover rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface-hover rounded">
                <div className="space-y-2">
                  <div className="h-4 bg-surface-active rounded w-28"></div>
                  <div className="h-3 bg-surface-active rounded w-24"></div>
                </div>
                <div className="h-6 bg-surface-active rounded w-24"></div>
              </div>
            ))}
          </div>
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

