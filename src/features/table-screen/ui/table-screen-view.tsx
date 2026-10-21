"use client";

import { useTableQuery } from "../api/use-table-query";
import { TableThemeProvider } from "./table-theme-provider";
import { TableScreen } from "./table-screen";
import { TableScreenSkeleton } from "./table-screen-skeleton";
import { TableScreenError } from "./table-screen-error";
import { CallActions } from "./call-actions";
import { parseApiError } from "@/shared/api/problem-details";

interface TableScreenViewProps {
  token: string;
}

export function TableScreenView({ token }: TableScreenViewProps) {
  const { data, isLoading, error, refetch } = useTableQuery(token);

  if (isLoading) {
    return <TableScreenSkeleton />;
  }

  if (error || !data) {
    const problem = parseApiError(error);
    if (problem.status === 404 || problem.code === "TABLE_NOT_FOUND") {
      return <TableScreenError type="NOT_FOUND" message={problem.detail} />;
    }
    return (
      <TableScreenError
        type="NETWORK"
        message={problem.detail}
        onRetry={() => refetch()}
      />
    );
  }

  if (!data.available) {
    const isSuspended = data.unavailableReason === "RESTAURANT_SUSPENDED";
    return (
      <TableThemeProvider appearance={data.appearance}>
        <TableScreenError
          type={isSuspended ? "SUSPENDED" : "PAUSED"}
          message={data.message}
        />
      </TableThemeProvider>
    );
  }

  return (
    <TableThemeProvider appearance={data.appearance}>
      <TableScreen
        tableNumber={data.tableNumber}
        appearance={data.appearance}
        available={data.available}
        unavailableReason={data.unavailableReason}
        message={data.message}
      >
        <CallActions
          token={token}
          calls={data.calls}
          available={data.available}
          showWaitTimeToCustomer={data.showWaitTimeToCustomer}
          texts={data.appearance.texts}
        />
      </TableScreen>
    </TableThemeProvider>
  );
}
