"use client";

import { useEffect, useState } from "react";

import { API_USE_DETAIL, API_USES } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type UseFilters = {
  status?: string;
  createdAfter?: string;
  createdBefore?: string;
};

export type UseRow = {
  id: string | number;
  code: string;
  equipmentId: string;
  equipmentName: string;
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
) {
  const [uses, setUses] = useState<UseRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const url = new URL(API_USES, window.location.origin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(pageSize));
        if (filters.status) url.searchParams.set("status", filters.status);
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
  }, [page, pageSize, filters.status, filters.createdAfter, filters.createdBefore, reloadKey]);

  return {
    uses,
    setUses,
    totalCount,
    setTotalCount,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}

export default useUses;
