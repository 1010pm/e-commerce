/**
 * Loading Skeleton Component
 * Skeleton loader matching the design
 */

export const SkeletonCard = () => (
  <div className="rounded-xl border border-gray-200 p-6 bg-white animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-32" />
      </div>
      <div className="w-12 h-12 bg-gray-200 rounded-lg" />
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="space-y-3">
    {Array(rows).fill(0).map((_, idx) => (
      <div key={idx} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
    ))}
  </div>
);

export const SkeletonGrid = ({ cols = 3, items = 6 }) => (
  <div className={`grid grid-cols-1 md:grid-cols-${cols} lg:grid-cols-${cols} gap-4`}>
    {Array(items).fill(0).map((_, idx) => (
      <div key={idx} className="rounded-xl bg-gray-100 animate-pulse aspect-square" />
    ))}
  </div>
);

export default SkeletonCard;
