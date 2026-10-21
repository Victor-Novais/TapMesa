"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api";
import { ThemeProvider } from "@/shared/ui/theme/theme-provider";
import { ToastProvider } from "@/shared/ui/toast";
import { AuthProvider, ImpersonationBar } from "@/features/auth";

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <ImpersonationBar />
            {children}
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
