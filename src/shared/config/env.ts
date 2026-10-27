import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_API_URL é obrigatória")
    .url("NEXT_PUBLIC_API_URL deve ser uma URL válida"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_APP_URL é obrigatória")
    .url("NEXT_PUBLIC_APP_URL deve ser uma URL válida"),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => ` - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `[Aproxime Aí] Falha na validação das variáveis de ambiente:\n${issues}`,
  );
}

export const env = parsed.data;
