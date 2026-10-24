import { Skeleton } from "@/shared/ui/skeleton";

// Espelha o layout real da tela da mesa (selo, logo 80px, título, dois botões de 64px)
// para que a troca skeleton → conteúdo não desloque nada.
export function TableScreenSkeleton() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-between bg-canvas p-4 sm:p-6">
      {/* Top Brand Header Skeleton */}
      <header className="flex w-full flex-col items-center pt-4 text-center">
        <div className="flex w-full justify-center">
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <Skeleton className="mt-6 h-20 w-20 rounded-sheet" />
        <Skeleton className="mt-4 h-7 w-44" />
        <Skeleton className="mt-2 h-4 w-60" />
        <Skeleton className="mt-3 h-5 w-40" />
      </header>

      {/* Main Buttons Placeholder Skeleton */}
      <main className="my-6 w-full space-y-4">
        <Skeleton className="h-16 w-full rounded-sheet" />
        <Skeleton className="h-16 w-full rounded-sheet" />
      </main>

      {/* Footer Info Skeleton */}
      <footer className="flex w-full flex-col items-center space-y-3 pb-6">
        <Skeleton className="h-16 w-full rounded-card" />
        <Skeleton className="h-3 w-32" />
      </footer>
    </div>
  );
}
