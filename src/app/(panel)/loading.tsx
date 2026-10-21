import { Skeleton } from "@/shared/ui/skeleton";

export default function PanelLoading() {
  return (
    <div className="space-y-4">
      {/* Counters Bar Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-2xl" />
        ))}
      </div>

      {/* Grid of Call Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-56 w-full rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
