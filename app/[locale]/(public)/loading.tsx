export default function PublicLoadingPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero skeleton */}
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded-xl" />
      </div>

      {/* Categories skeleton */}
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Products skeleton */}
      <div className="animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-gray-200 rounded-xl" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
