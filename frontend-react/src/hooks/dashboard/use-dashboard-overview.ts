"use client";

import { useEffect, useState } from "react";

import { API_DASHBOARD_OVERVIEW } from "@/constants/api";
import { authFetch } from "@/lib/auth/fetch";

export type DashboardOverviewTotals = {
  total_requests: number;
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
  expired: number;
};

export type DashboardOverviewUpcoming = {
  id: string;
  title: string;
  type: string;
  requester_name?: string;
  start_time: string;
  end_time?: string | null;
  href: string;
};

export type DashboardOverviewActivity = {
  id: string;
  title: string;
  code: string;
  type: string;
  status: string;
  created_at: string;
  href: string;
};

export type DashboardOverviewResponse = {
  totals: DashboardOverviewTotals;
  upcoming_approved: DashboardOverviewUpcoming[];
  recent_activities: DashboardOverviewActivity[];
};

type DashboardOverviewTotalsPayload = Partial<DashboardOverviewTotals> & {
  failed?: number;
};

type DashboardOverviewPayload = {
  totals?: DashboardOverviewTotalsPayload;
  upcoming_approved?: DashboardOverviewUpcoming[];
  recent_activities?: DashboardOverviewActivity[];
};

const EMPTY_OVERVIEW: DashboardOverviewResponse = {
  totals: {
    total_requests: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    expired: 0,
  },
  upcoming_approved: [],
  recent_activities: [],
};

export function useDashboardOverview() {
  const [overview, setOverview] = useState<DashboardOverviewResponse>(EMPTY_OVERVIEW);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await authFetch(API_DASHBOARD_OVERVIEW, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Gagal memuat dashboard overview (${response.status})`);
        }

        const payload = (await response.json()) as DashboardOverviewPayload;
        setOverview({
          totals: {
            total_requests: payload.totals?.total_requests ?? 0,
            pending: payload.totals?.pending ?? 0,
            approved: payload.totals?.approved ?? 0,
            completed: payload.totals?.completed ?? 0,
            rejected: payload.totals?.rejected ?? payload.totals?.failed ?? 0,
            expired: payload.totals?.expired ?? 0,
          },
          upcoming_approved: Array.isArray(payload.upcoming_approved)
            ? payload.upcoming_approved
            : [],
          recent_activities: Array.isArray(payload.recent_activities)
            ? payload.recent_activities
            : [],
        });
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Terjadi kesalahan.");
      } finally {
        if (isAborted || controller.signal.aborted) return;
        setIsLoading(false);
      }
    };

    void load();

    return () => {
      isAborted = true;
      controller.abort();
    };
  }, []);

  return { overview, isLoading, error };
}

export default useDashboardOverview;
