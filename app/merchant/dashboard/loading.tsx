export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="liquid-glass p-6 animate-pulse">
            <div className="h-4 bg-surface-hover rounded w-24 mb-4"></div>
            <div className="h-8 bg-surface-hover rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="liquid-glass p-6 animate-pulse">
        <div className="h-6 bg-surface-hover rounded w-48 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-surface-active rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

