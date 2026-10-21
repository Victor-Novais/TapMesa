import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Button } from "./button";

export interface PaginationProps {
  page?: number;
  totalPages?: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  className?: string;
}

export function Pagination({
  page,
  totalPages,
  hasPreviousPage = false,
  hasNextPage = false,
  onPreviousPage,
  onNextPage,
  className,
}: PaginationProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 select-none",
        className,
      )}
    >
      <div className="text-xs sm:text-sm">
        {page !== undefined && totalPages !== undefined ? (
          <span>
            Página{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">{page}</strong>{" "}
            de{" "}
            <strong className="text-zinc-900 dark:text-zinc-100">
              {totalPages}
            </strong>
          </span>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPreviousPage}
          onClick={onPreviousPage}
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={onNextPage}
          aria-label="Próxima página"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
