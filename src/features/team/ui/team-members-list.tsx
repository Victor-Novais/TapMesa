"use client";

import * as React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/shared/ui/data-table";
import { Badge } from "@/shared/ui/badge";
import { Button, IconButton } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/shared/ui/dropdown-menu";
import {
  User,
  ShieldCheck,
  UtensilsCrossed,
  KeyRound,
  Trash2,
  Lock,
  Unlock,
  MoreVertical,
  CheckCircle2,
} from "lucide-react";
import type { TeamUser } from "@/shared/types/api";

export interface TeamMembersListProps {
  members: TeamUser[];
  currentUserId?: string;
  currentUsername?: string;
  onToggleStatus: (user: TeamUser) => void;
  onResetPassword: (user: TeamUser) => void;
  onDelete: (user: TeamUser) => void;
  isTogglingId?: string | null;
}

export function TeamMembersList({
  members,
  currentUserId,
  currentUsername,
  onToggleStatus,
  onResetPassword,
  onDelete,
  isTogglingId,
}: TeamMembersListProps) {
  const isSelf = (member: TeamUser) => {
    return (
      (currentUserId && member.id === currentUserId) ||
      (currentUsername && member.username === currentUsername)
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(d);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full">
      {/* 1. Tabela Desktop / Tablet */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Membro</TableHead>
              <TableHead className="w-[140px]">Função</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[180px]">Cadastrado em</TableHead>
              <TableHead className="w-[220px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const self = isSelf(member);
              const isToggling = isTogglingId === member.id;

              return (
                <TableRow key={member.id} className="group">
                  {/* Nome de usuário e avatar */}
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                        {member.role === "OWNER" ? (
                          <ShieldCheck className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        ) : (
                          <UtensilsCrossed className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100">
                            {member.username}
                          </span>
                          {self && (
                            <span className="rounded-md bg-orange-100 px-1.5 py-0.2 text-[10px] font-semibold text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                              Você
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Papel */}
                  <TableCell>
                    {member.role === "OWNER" ? (
                      <Badge variant="primary" size="sm">
                        Gerente / Dono
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        Garçom
                      </Badge>
                    )}
                  </TableCell>

                  {/* Status */}
                  <TableCell>
                    {member.active ? (
                      <Badge variant="success" size="sm" className="gap-1.5">
                        <CheckCircle2 className="h-3 w-3" />
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm" className="gap-1.5">
                        <Lock className="h-3 w-3" />
                        Bloqueado
                      </Badge>
                    )}
                  </TableCell>

                  {/* Data */}
                  <TableCell className="text-xs text-zinc-500 dark:text-zinc-400 tabular-nums">
                    {formatDate(member.createdAt)}
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Ativar / Bloquear */}
                      {self ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <IconButton
                                variant="ghost"
                                size="sm"
                                disabled
                                aria-label="Ação desabilitada para a sua própria conta"
                              >
                                <Lock className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                              </IconButton>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Você não pode bloquear sua própria conta
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              variant="ghost"
                              size="sm"
                              isLoading={isToggling}
                              onClick={() => onToggleStatus(member)}
                              aria-label={
                                member.active
                                  ? `Bloquear acesso de ${member.username}`
                                  : `Ativar acesso de ${member.username}`
                              }
                              className={
                                member.active
                                  ? "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                  : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                              }
                            >
                              {member.active ? (
                                <Lock className="h-4 w-4" />
                              ) : (
                                <Unlock className="h-4 w-4" />
                              )}
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>
                            {member.active
                              ? "Bloquear acesso"
                              : "Ativar acesso"}
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* Resetar Senha */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onResetPassword(member)}
                            className="gap-1.5 text-xs font-semibold"
                          >
                            <KeyRound className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                            <span>Nova Senha</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          Gerar nova senha temporária para {member.username}
                        </TooltipContent>
                      </Tooltip>

                      {/* Excluir Membro */}
                      {self ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <IconButton
                                variant="ghost"
                                size="sm"
                                disabled
                                aria-label="Não é possível excluir o próprio usuário logado"
                              >
                                <Trash2 className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                              </IconButton>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            Você não pode excluir sua própria conta
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <IconButton
                              variant="ghost"
                              size="sm"
                              onClick={() => onDelete(member)}
                              aria-label={`Excluir ${member.username}`}
                              className="text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                            >
                              <Trash2 className="h-4 w-4" />
                            </IconButton>
                          </TooltipTrigger>
                          <TooltipContent>Excluir membro</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* 2. Lista de Cards no Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
        {members.map((member) => {
          const self = isSelf(member);

          return (
            <Card key={member.id} className="p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-50">
                        {member.username}
                      </h4>
                      {self && (
                        <span className="rounded-md bg-orange-100 px-1.5 py-0.2 text-[10px] font-semibold text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                          Você
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      {member.role === "OWNER" ? (
                        <Badge variant="primary" size="sm">
                          Gerente
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          Garçom
                        </Badge>
                      )}
                      {member.active ? (
                        <Badge variant="success" size="sm" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="danger" size="sm" className="gap-1">
                          <Lock className="h-3 w-3" />
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropdown de opções no mobile */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      aria-label={`Opções para ${member.username}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </IconButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => onResetPassword(member)}>
                      <KeyRound className="mr-2 h-4 w-4 text-orange-600" />
                      <span>Gerar nova senha</span>
                    </DropdownMenuItem>
                    {!self && (
                      <>
                        <DropdownMenuItem
                          onClick={() => onToggleStatus(member)}
                        >
                          {member.active ? (
                            <>
                              <Lock className="mr-2 h-4 w-4 text-amber-600" />
                              <span>Bloquear acesso</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="mr-2 h-4 w-4 text-emerald-600" />
                              <span>Ativar acesso</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="danger"
                          onClick={() => onDelete(member)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Excluir membro</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500">
                <span>Cadastrado em {formatDate(member.createdAt)}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onResetPassword(member)}
                  className="gap-1 text-xs h-8"
                >
                  <KeyRound className="h-3 w-3" />
                  <span>Senha</span>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
