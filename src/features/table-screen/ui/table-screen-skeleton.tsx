import { Skeleton } from "@/shared/ui/skeleton";

export function TableScreenSkeleton() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-between p-4 sm:p-6 max-w-md mx-auto w-full">
      {/* Top Brand Header Skeleton */}
      <header className="flex flex-col items-center pt-6 text-center w-full space-y-3">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <Skeleton className="h-6 w-44 rounded-lg" />
        <Skeleton className="h-4 w-60 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </header>

      {/* Main Buttons Placeholder Skeleton */}
      <main className="w-full space-y-4 my-8">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </main>

      {/* Footer Info Skeleton */}
      <footer className="w-full flex flex-col items-center pb-6 space-y-3">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-3 w-32 rounded" />
      </footer>
    </div>
  );
}
