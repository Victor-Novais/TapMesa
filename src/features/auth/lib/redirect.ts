import type { Role } from "@/shared/types/api";

export function getDefaultPathForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "OWNER":
      return "/dashboard";
    case "WAITER":
      return "/panel";
    default:
      return "/login";
  }
}

export function isPathAllowedForRole(path: string, role: Role): boolean {
  const normalizedPath = path.split("?")[0] || "";

  if (normalizedPath.startsWith("/admin")) {
    return role === "ADMIN";
  }

  if (normalizedPath.startsWith("/dashboard")) {
    return role === "OWNER" || role === "ADMIN";
  }

  if (normalizedPath.startsWith("/panel")) {
    return role === "WAITER" || role === "OWNER" || role === "ADMIN";
  }

  // Public table route
  if (normalizedPath.startsWith("/m/")) {
    return true;
  }

  return true;
}

export function getSafeRedirectUrl(
  nextUrl: string | null | undefined,
  role: Role,
): string {
  const defaultPath = getDefaultPathForRole(role);

  if (!nextUrl || typeof nextUrl !== "string") {
    return defaultPath;
  }

  const trimmed = nextUrl.trim();

  // Security checks: must start with / and not have protocol or double slash
  if (
    !trimmed.startsWith("/") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/\\") ||
    trimmed.includes(":")
  ) {
    return defaultPath;
  }

  // Prevent redirect loops to login
  if (trimmed.startsWith("/login")) {
    return defaultPath;
  }

  // Check if role has access to destination
  if (!isPathAllowedForRole(trimmed, role)) {
    return defaultPath;
  }

  return trimmed;
}
