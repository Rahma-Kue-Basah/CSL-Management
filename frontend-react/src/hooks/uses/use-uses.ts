"use client";

import { useEffect, useState } from "react";

import { API_USE_DETAIL, API_USES, API_USES_MY } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type UseFilters = {
  status?: string;
  createdAfter?: string;
  createdBefore?: string;
  requestedBy?: string;
};

export type UseListScope = "default" | "my" | "all";

export type UseRow = {
  id: string | number;
  code: string;
  equipmentId: string;
  equipmentName: string;
  roomName: string;
  requesterId: string;
  requesterName: string;
  approvedById: string;
  approvedByName: string;
  status: string;
  purpose: string;
  quantity: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  note: string;
};

type ApiUse = {
  id?: string | number | null;
  code?: string | null;
  status?: string | null;
  purpose?: string | null;
  note?: string | null;
  quantity?: number | string | null;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  equipment?: string | number | null;
  equipment_detail?: {
    id?: string | number | null;
    name?: string | null;
    room_detail?: {
      id?: string | number | null;
      name?: string | null;
    } | null;
  } | null;
  requested_by?: string | number | null;
  requested_by_detail?: {
    id?: string | number | null;
    full_name?: string | null;
    email?: string | null;
  } | null;
  approved_by?: string | number | null;
  approved_by_detail?: {
    id?: string | number | null;
    full_name?: string | null;
    email?: string | null;
  } | null;
};

type ApiUsesResponse = {
  count?: number;
  results?: ApiUse[];
  aggregates?: {
    total?: number;
    pending?: number;
    approved?: number;
    completed?: number;
    rejected?: number;
    expired?: number;
  } | null;
};

export type UseAggregates = {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
  expired: number;
};

export function mapUse(item: ApiUse): UseRow {
  const requesterName =
    item.requested_by_detail?.full_name ||
    item.requested_by_detail?.email ||
    "-";
  const approvedByName =
    item.approved_by_detail?.full_name ||
    item.approved_by_detail?.email ||
    "-";

  return {
    id: item.id ?? `use-${Math.random().toString(36).slice(2, 8)}`,
    code: String(item.code ?? "-"),
    equipmentId: String(item.equipment_detail?.id ?? item.equipment ?? ""),
    equipmentName: String(item.equipment_detail?.name ?? "-"),
    roomName: String(item.equipment_detail?.room_detail?.name ?? "-"),
    requesterId: String(item.requested_by_detail?.id ?? item.requested_by ?? ""),
    requesterName: String(requesterName),
    approvedById: String(item.approved_by_detail?.id ?? item.approved_by ?? ""),
    approvedByName: String(approvedByName),
    status: String(item.status ?? "-"),
    purpose: String(item.purpose ?? "-"),
    quantity: String(item.quantity ?? "-"),
    startTime: String(item.start_time ?? "-"),
    endTime: String(item.end_time ?? "-"),
    createdAt: String(item.created_at ?? "-"),
    updatedAt: String(item.updated_at ?? "-"),
    note: String(item.note ?? ""),
  };
}

export function useUseDetail(id?: string | number | null) {
  const [useItem, setUseItem] = useState<UseRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setUseItem(null);
      setError("ID penggunaan tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await authFetch(API_USE_DETAIL(id), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat detail penggunaan alat (${response.status})`);
        }

        const payload = (await response.json()) as ApiUse;
        setUseItem(mapUse(payload));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
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
  }, [id]);

  return {
    useItem,
    setUseItem,
    isLoading,
    error,
    setError,
  };
}

export function useUses(
  page: number,
  pageSize = 10,
  filters: UseFilters = {},
  reloadKey = 0,
  scope: UseListScope = "default",
) {
  const [uses, setUses] = useState<UseRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");
  const [aggregates, setAggregates] = useState<UseAggregates>({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    expired: 0,
  });

  useEffect(() => {
    if (scope === "my" && !filters.requestedBy) {
      setUses([]);
      setTotalCount(0);
      setAggregates({
        total: 0,
        pending: 0,
        approved: 0,
        completed: 0,
        rejected: 0,
        expired: 0,
      });
      setError("");
      setIsLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const listEndpoint = scope === "my" ? API_USES_MY : API_USES;
        const url = new URL(listEndpoint, window.location.origin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(pageSize));
        if (filters.status) url.searchParams.set("status", filters.status);
        if (filters.requestedBy && scope !== "my") {
          url.searchParams.set("requested_by", filters.requestedBy);
        }
        if (filters.createdAfter) {
          url.searchParams.set("created_after", filters.createdAfter);
        }
        if (filters.createdBefore) {
          url.searchParams.set("created_before", filters.createdBefore);
        }

        const response = await authFetch(url.toString(), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Gagal memuat data penggunaan alat (${response.status})`);

        const payload = (await response.json()) as ApiUsesResponse | ApiUse[];
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.results)
            ? payload.results
            : [];
        const mapped = list.map(mapUse);

        setUses(mapped);
        setTotalCount(Array.isArray(payload) ? mapped.length : (payload.count ?? mapped.length));
        setAggregates({
          total: Array.isArray(payload) ? mapped.length : Number(payload.aggregates?.total ?? 0),
          pending: Array.isArray(payload) ? 0 : Number(payload.aggregates?.pending ?? 0),
          approved: Array.isArray(payload) ? 0 : Number(payload.aggregates?.approved ?? 0),
          completed: Array.isArray(payload) ? 0 : Number(payload.aggregates?.completed ?? 0),
          rejected: Array.isArray(payload) ? 0 : Number(payload.aggregates?.rejected ?? 0),
          expired: Array.isArray(payload) ? 0 : Number(payload.aggregates?.expired ?? 0),
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        if (isAborted || controller.signal.aborted) return;
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    };

    void load();

    return () => {
      isAborted = true;
      controller.abort();
    };
  }, [page, pageSize, filters.status, filters.createdAfter, filters.createdBefore, filters.requestedBy, reloadKey, scope]);

  return {
    uses,
    setUses,
    totalCount,
    setTotalCount,
    aggregates,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}

export default useUses;
