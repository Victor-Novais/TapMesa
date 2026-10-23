"use client";

import { create } from "zustand";
import type {
  PanelCallDto,
  RecentAttendedCallDto,
  PanelStateDto,
} from "@/shared/types/api";
import type { ConnectionStatus } from "@/shared/ui/connection-indicator";
import { syncClock } from "@/shared/lib/clock";

export interface PanelThresholds {
  alertSec: number;
  urgentSec: number;
}

export interface PanelCounters {
  activeCallsCount: number;
  waiterCallsCount: number;
  billCallsCount: number;
}

interface PanelState {
  calls: PanelCallDto[];
  recent: RecentAttendedCallDto[];
  thresholds: PanelThresholds;
  counters: PanelCounters;
  connectionStatus: ConnectionStatus;
  isPollingFallback: boolean;

  // Actions
  setSnapshot: (snapshot: PanelStateDto) => void;
  addCall: (call: PanelCallDto) => void;
  updateCall: (id: string, patch: Partial<PanelCallDto>) => void;
  removeCall: (id: string) => void;
  setRecent: (recent: RecentAttendedCallDto[]) => void;
  addRecent: (call: RecentAttendedCallDto) => void;
  updateRecent: (id: string, patch: Partial<RecentAttendedCallDto>) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setIsPollingFallback: (isPolling: boolean) => void;
  setThresholds: (thresholds: PanelThresholds) => void;
  reset: () => void;
}

const DEFAULT_THRESHOLDS: PanelThresholds = {
  alertSec: 180,
  urgentSec: 300,
};

function recalculateCounters(calls: PanelCallDto[]): PanelCounters {
  const activeCalls = calls.filter(
    (c) => c.status === "PENDING" || c.status === "ATTENDED",
  );
  const waiterCallsCount = activeCalls.filter(
    (c) => c.type === "WAITER",
  ).length;
  const billCallsCount = activeCalls.filter((c) => c.type === "BILL").length;

  return {
    activeCallsCount: activeCalls.length,
    waiterCallsCount,
    billCallsCount,
  };
}

function sortCallsOldestFirst(calls: PanelCallDto[]): PanelCallDto[] {
  return [...calls].sort((a, b) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeA - timeB;
  });
}

export const usePanelStore = create<PanelState>((set) => ({
  calls: [],
  recent: [],
  thresholds: DEFAULT_THRESHOLDS,
  counters: {
    activeCallsCount: 0,
    waiterCallsCount: 0,
    billCallsCount: 0,
  },
  connectionStatus: "reconnecting",
  isPollingFallback: false,

  setSnapshot: (snapshot) => {
    syncClock(snapshot.serverNow);

    const sortedCalls = sortCallsOldestFirst(snapshot.activeCalls);
    const recentCalls = snapshot.recentCalls;
    const { alertSec, urgentSec } = snapshot.thresholds;
    const counters = recalculateCounters(sortedCalls);

    set({
      calls: sortedCalls,
      recent: recentCalls,
      thresholds: { alertSec, urgentSec },
      counters,
      connectionStatus: "connected",
      isPollingFallback: false,
    });
  },

  addCall: (call) =>
    set((state) => {
      const existingIdx = state.calls.findIndex((c) => c.id === call.id);
      let updatedCalls: PanelCallDto[];

      if (existingIdx >= 0) {
        updatedCalls = state.calls.map((c, i) =>
          i === existingIdx ? { ...c, ...call } : c,
        );
      } else {
        updatedCalls = [...state.calls, call];
      }

      const sorted = sortCallsOldestFirst(updatedCalls);
      return {
        calls: sorted,
        counters: recalculateCounters(sorted),
      };
    }),

  updateCall: (id, patch) =>
    set((state) => {
      const updatedCalls = state.calls.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      );
      const sorted = sortCallsOldestFirst(updatedCalls);
      return {
        calls: sorted,
        counters: recalculateCounters(sorted),
      };
    }),

  removeCall: (id) =>
    set((state) => {
      const updatedCalls = state.calls.filter((c) => c.id !== id);
      return {
        calls: updatedCalls,
        counters: recalculateCounters(updatedCalls),
      };
    }),

  setRecent: (recent) => set({ recent }),

  addRecent: (call) =>
    set((state) => {
      const filtered = state.recent.filter((c) => c.id !== call.id);
      const updated = [call, ...filtered].slice(0, 50);
      return { recent: updated };
    }),

  updateRecent: (id, patch) =>
    set((state) => ({
      recent: state.recent.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setIsPollingFallback: (isPollingFallback) => set({ isPollingFallback }),

  setThresholds: (thresholds) => set({ thresholds }),

  reset: () =>
    set({
      calls: [],
      recent: [],
      thresholds: DEFAULT_THRESHOLDS,
      counters: {
        activeCallsCount: 0,
        waiterCallsCount: 0,
        billCallsCount: 0,
      },
      connectionStatus: "offline",
      isPollingFallback: false,
    }),
}));
