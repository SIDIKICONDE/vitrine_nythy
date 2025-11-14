/**
 * PageSkeleton - Skeleton de chargement pour les pages
 * Composant réutilisable pour afficher un état de chargement cohérent
 */

interface PageSkeletonProps {
  showHeader?: boolean;
  showStats?: boolean;
  showTable?: boolean;
  showCards?: boolean;
  cardsCount?: number;
}

export default function PageSkeleton({
  showHeader = true,
  showStats = false,
  showTable = false,
  showCards = false,
  cardsCount = 3,
}: PageSkeletonProps) {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      {showHeader && (
        <div className="space-y-2">
          <div className="h-8 bg-surface-hover rounded w-64"></div>
          <div className="h-4 bg-surface-hover rounded w-96"></div>
        </div>
      )}

      {/* Stats Skeleton */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="liquid-glass p-6">
              <div className="h-4 bg-surface-hover rounded w-24 mb-4"></div>
              <div className="h-8 bg-surface-hover rounded w-20 mb-2"></div>
              <div className="h-3 bg-surface-hover rounded w-16"></div>
            </div>
          ))}
        </div>
      )}

      {/* Cards Skeleton */}
      {showCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(cardsCount)].map((_, i) => (
            <div key={i} className="liquid-glass p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-surface-hover rounded-full"></div>
                <div className="flex-1">
                  <div className="h-5 bg-surface-hover rounded w-32 mb-2"></div>
                  <div className="h-3 bg-surface-hover rounded w-24"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-surface-hover rounded w-full"></div>
                <div className="h-3 bg-surface-hover rounded w-5/6"></div>
                <div className="h-3 bg-surface-hover rounded w-4/6"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table Skeleton */}
      {showTable && (
        <div className="liquid-glass p-6">
          <div className="h-6 bg-surface-hover rounded w-48 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-surface-active rounded-lg">
                <div className="w-12 h-12 bg-surface-hover rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-surface-hover rounded w-3/4"></div>
                  <div className="h-3 bg-surface-hover rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-surface-hover rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

