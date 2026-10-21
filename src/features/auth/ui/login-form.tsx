"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  AlertCircle,
  Clock,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { login, getMe } from "@/shared/api/auth";
import { parseProblemDetails } from "@/shared/api/problem-details";
import { getErrorMessage } from "@/shared/messages/errors";
import { useAuthStore } from "../model/auth-store";
import { getSafeRedirectUrl } from "../lib/redirect";

const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Informe seu nome de usuário")
    .max(50, "O nome de usuário deve ter no máximo 50 caracteres")
    .trim(),
  password: z
    .string()
    .min(1, "Informe sua senha")
    .max(100, "A senha não pode exceder 100 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isExpired = searchParams.get("expired") === "true";
  const nextParam = searchParams.get("next");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Countdown timer for 429 Rate Limiting
  useEffect(() => {
    if (rateLimitSeconds > 0) {
      countdownIntervalRef.current = setInterval(() => {
        setRateLimitSeconds((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [rateLimitSeconds]);

  const onSubmit = async (data: LoginFormData) => {
    if (rateLimitSeconds > 0) return;

    setErrorMessage(null);
    setIsLocked(false);

    try {
      const loginResponse = await login(data);
      const user = await getMe();
      if (!user.username) {
        user.username = data.username;
      }

      setAuth(loginResponse.accessToken, user);

      const destination = getSafeRedirectUrl(nextParam, user.role);
      router.push(destination);
    } catch (err: unknown) {
      const problem = parseProblemDetails(err);

      if (problem.status === 429) {
        setRateLimitSeconds(60);
        setErrorMessage(
          "Muitas tentativas em pouco tempo. Por segurança, aguarde alguns instantes antes de tentar novamente.",
        );
        return;
      }

      if (problem.code === "ACCOUNT_LOCKED") {
        setIsLocked(true);
        setErrorMessage(
          "Conta temporariamente bloqueada por 15 minutos após 5 tentativas incorretas consecutivas. Por favor, aguarde antes de tentar novamente.",
        );
        return;
      }

      if (problem.code === "INVALID_CREDENTIALS") {
        setErrorMessage(
          "Usuário ou senha incorretos. Verifique suas credenciais e tente novamente.",
        );
        return;
      }

      if (
        problem.code === "ACCOUNT_INACTIVE" ||
        problem.code === "USER_INACTIVE"
      ) {
        setErrorMessage(
          "Esta conta de usuário foi desativada. Entre em contato com o administrador.",
        );
        return;
      }

      if (problem.code === "RESTAURANT_SUSPENDED") {
        setErrorMessage(
          "As operações deste restaurante estão suspensas no momento. Contate o suporte da plataforma.",
        );
        return;
      }

      setErrorMessage(getErrorMessage(problem.code, problem.detail));
    }
  };

  return (
    <div className="w-full space-y-6">
      {isExpired && !errorMessage && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-900 dark:text-amber-200"
        >
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold">Sessão expirada</p>
            <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-300/90">
              Sua sessão foi encerrada por tempo de inatividade. Por favor, faça
              login novamente para continuar.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            isLocked
              ? "border-red-500/30 bg-red-500/10 text-red-950 dark:text-red-200"
              : rateLimitSeconds > 0
                ? "border-amber-500/30 bg-amber-500/10 text-amber-950 dark:text-amber-200"
                : "border-red-500/20 bg-red-500/10 text-red-900 dark:text-red-200"
          }`}
        >
          {isLocked ? (
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          ) : rateLimitSeconds > 0 ? (
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          ) : (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          )}

          <div className="space-y-1">
            <p className="font-semibold">
              {isLocked
                ? "Acesso bloqueado por segurança"
                : rateLimitSeconds > 0
                  ? `Aguarde ${rateLimitSeconds}s`
                  : "Não foi possível acessar"}
            </p>
            <p className="text-xs leading-relaxed opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          {...register("username")}
          id="login-username"
          label="Usuário"
          placeholder="ex: gerente ou garcom1"
          autoFocus
          autoComplete="username"
          disabled={isSubmitting || rateLimitSeconds > 0}
          error={errors.username?.message}
          startAdornment={<User className="h-4 w-4" />}
        />

        <Input
          {...register("password")}
          id="login-password"
          label="Senha"
          type={showPassword ? "text" : "password"}
          placeholder="Sua senha de acesso"
          autoComplete="current-password"
          disabled={isSubmitting || rateLimitSeconds > 0}
          error={errors.password?.message}
          startAdornment={<Lock className="h-4 w-4" />}
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
              className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:text-zinc-200"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={isSubmitting || rateLimitSeconds > 0}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Entrando...
            </>
          ) : rateLimitSeconds > 0 ? (
            `Aguarde ${rateLimitSeconds}s...`
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Entrar no sistema
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
