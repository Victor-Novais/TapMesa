"use client";

import { useTheme } from "@/shared/ui/theme/theme-provider";
import { useAuth } from "@/features/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/shared/ui/dropdown-menu";
import { Button } from "@/shared/ui/button";
import { UI_MESSAGES } from "@/shared/messages/ui";
import { User, Sun, Moon, Laptop, LogOut, Radio } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function UserMenu() {
  const { user, username, role, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  if (!user) return null;

  const displayName = username || user.sub.slice(0, 8);
  const roleLabel = role ? UI_MESSAGES.roles[role] || role : "Usuário";
  const initial = displayName.charAt(0).toUpperCase();

  const isPanel = pathname.startsWith("/panel");
  const canAccessPanel =
    role === "WAITER" || role === "OWNER" || role === "ADMIN";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-10 w-10 min-h-[44px] min-w-[44px] rounded-full border border-zinc-200 bg-zinc-100 p-0 hover:bg-zinc-200 dark:border-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          aria-label={`Menu do usuário ${displayName}`}
        >
          <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200">
            {initial}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-zinc-900 dark:text-zinc-50">
              {displayName}
            </p>
            <p className="text-xs leading-none text-zinc-500 dark:text-zinc-400">
              {roleLabel}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {canAccessPanel && !isPanel && (
          <DropdownMenuItem asChild>
            <Link href="/panel" className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-orange-600" />
              <span>Painel de Atendimento</span>
            </Link>
          </DropdownMenuItem>
        )}

        {role !== "WAITER" && isPanel && (
          <DropdownMenuItem asChild>
            <Link href="/dashboard" className="flex items-center gap-2">
              <User className="h-4 w-4 text-orange-600" />
              <span>Painel de Gestão</span>
            </Link>
          </DropdownMenuItem>
        )}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : theme === "light" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Laptop className="h-4 w-4" />
            )}
            <span>{UI_MESSAGES.theme.label}</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(val) =>
                setTheme(val as "light" | "dark" | "system")
              }
            >
              <DropdownMenuRadioItem value="light">
                <Sun className="mr-2 h-4 w-4" />
                {UI_MESSAGES.theme.light}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">
                <Moon className="mr-2 h-4 w-4" />
                {UI_MESSAGES.theme.dark}
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">
                <Laptop className="mr-2 h-4 w-4" />
                {UI_MESSAGES.theme.system}
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          variant="danger"
          onClick={() => logout()}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span>{UI_MESSAGES.userMenu.logout}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
