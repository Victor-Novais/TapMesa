"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore, getDefaultPathForRole } from "@/features/auth";

function HomeRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status, user } = useAuthStore();

  useEffect(() => {
    // Legacy / QR code compatibility: /?m=TOKEN redirects to /m/TOKEN
    const tableToken = searchParams.get("m");
    if (tableToken) {
      router.replace(`/m/${encodeURIComponent(tableToken)}`);
      return;
    }

    if (status === "loading") {
      return;
    }

    if (status === "authenticated" && user) {
      const destination = getDefaultPathForRole(user.role);
      router.replace(destination);
      return;
    }

    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, user, searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Carregando TapMesa...
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Suspense
        fallback={
          <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        }
      >
        <HomeRedirect />
      </Suspense>
    </main>
  );
}
