/**
 * ReviewsSkeleton - Skeleton pour la page avis
 */

export default function ReviewsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 bg-surface-hover rounded w-64"></div>
        <div className="h-4 bg-surface-hover rounded w-96"></div>
      </div>

      {/* Stats moyenne */}
      <div className="liquid-glass p-6">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          <div className="text-center">
            <div className="h-20 w-20 bg-surface-hover rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-surface-hover rounded w-32 mx-auto"></div>
          </div>
          <div className="flex-1 w-full space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-3 bg-surface-hover rounded w-16"></div>
                <div className="flex-1 h-3 bg-surface-hover rounded"></div>
                <div className="h-3 bg-surface-hover rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="liquid-glass p-4">
        <div className="flex gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-8 bg-surface-hover rounded w-24"></div>
          ))}
        </div>
      </div>

      {/* Liste des avis */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="liquid-glass p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-surface-hover"></div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-5 bg-surface-hover rounded w-32"></div>
                  <div className="h-4 bg-surface-hover rounded w-20"></div>
                </div>
                <div className="h-3 bg-surface-hover rounded w-24 mb-3"></div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <div key={j} className="w-5 h-5 bg-surface-hover rounded"></div>
                  ))}
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-surface-hover rounded w-full"></div>
                  <div className="h-4 bg-surface-hover rounded w-5/6"></div>
                  <div className="h-4 bg-surface-hover rounded w-4/6"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 bg-surface-hover rounded w-24"></div>
                  <div className="h-8 bg-surface-hover rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

