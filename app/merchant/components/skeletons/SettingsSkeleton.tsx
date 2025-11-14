/**
 * SettingsSkeleton - Skeleton pour la page paramètres
 */

export default function SettingsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 bg-surface-hover rounded w-64"></div>
        <div className="h-4 bg-surface-hover rounded w-96"></div>
      </div>

      {/* Tabs */}
      <div className="liquid-glass p-2">
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-surface-hover rounded w-32"></div>
          ))}
        </div>
      </div>

      {/* Form sections */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="liquid-glass p-6">
          <div className="h-6 bg-surface-hover rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, j) => (
              <div key={j}>
                <div className="h-4 bg-surface-hover rounded w-32 mb-2"></div>
                <div className="h-10 bg-surface-hover rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Actions buttons */}
      <div className="flex justify-end gap-4">
        <div className="h-10 bg-surface-hover rounded w-24"></div>
        <div className="h-10 bg-surface-hover rounded w-32"></div>
      </div>
    </div>
  );
}

