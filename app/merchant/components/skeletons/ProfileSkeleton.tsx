/**
 * ProfileSkeleton - Skeleton pour la page profil
 */

export default function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Bannière et photo */}
      <div className="liquid-glass overflow-hidden">
        <div className="h-48 bg-surface-hover"></div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start -mt-20">
            <div className="w-32 h-32 rounded-full bg-surface-active border-4 border-surface"></div>
            <div className="flex-1 mt-16 md:mt-0">
              <div className="h-8 bg-surface-hover rounded w-64 mb-2"></div>
              <div className="h-4 bg-surface-hover rounded w-48 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-6 bg-surface-hover rounded w-24"></div>
                <div className="h-6 bg-surface-hover rounded w-32"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="liquid-glass p-6">
        <div className="h-6 bg-surface-hover rounded w-32 mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-surface-hover rounded w-full"></div>
          <div className="h-4 bg-surface-hover rounded w-5/6"></div>
          <div className="h-4 bg-surface-hover rounded w-4/6"></div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="liquid-glass p-6">
        <div className="h-6 bg-surface-hover rounded w-48 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-surface-hover rounded-lg">
              <div className="w-16 h-16 rounded-full bg-surface-active"></div>
              <div className="flex-1">
                <div className="h-8 bg-surface-active rounded w-20 mb-2"></div>
                <div className="h-4 bg-surface-active rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-6 bg-surface-hover rounded w-48 mb-4 mt-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-4 bg-surface-hover rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-surface-active"></div>
                <div className="flex-1">
                  <div className="h-6 bg-surface-active rounded w-16 mb-2"></div>
                  <div className="h-3 bg-surface-active rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Autres sections */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="liquid-glass p-6">
          <div className="h-6 bg-surface-hover rounded w-40 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-start gap-3">
                <div className="w-6 h-6 bg-surface-hover rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-surface-hover rounded w-32 mb-2"></div>
                  <div className="h-3 bg-surface-hover rounded w-48"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

