"use client";

import { useEffect, useState } from "react";

import {
  API_USE_DETAIL,
  API_USES,
  API_USES_ALL,
  API_USES_MY,
} from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type UseFilters = {
  q?: string;
  status?: string;
  department?: string;
  equipment?: string;
  room?: string;
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
  roomPicName: string;
  requesterId: string;
  requesterName: string;
  requesterDepartment: string;
  approvedById: string;
  approvedByName: string;
  status: string;
  purpose: string;
  quantity: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string;
  rejectedAt: string;
  rejectionNote: string;
  expiredAt: string;
  completedAt: string;
  note: string;
  requesterPhone: string;
  requesterMentor: string;
  institution: string;
  institutionAddress: string;
};

type ApiUse = {
  id?: string | number | null;
  code?: string | null;
  status?: string | null;
  purpose?: string | null;
  note?: string | null;
  requester_phone?: string | null;
  requester_mentor?: string | null;
  institution?: string | null;
  institution_address?: string | null;
  quantity?: number | string | null;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_note?: string | null;
  expired_at?: string | null;
  completed_at?: string | null;
  equipment?: string | number | null;
  equipment_detail?: {
    id?: string | number | null;
    name?: string | null;
    room_detail?: {
      id?: string | number | null;
      name?: string | null;
      pics_detail?: Array<{
        full_name?: string | null;
        email?: string | null;
      }> | null;
    } | null;
  } | null;
  requested_by?: string | number | null;
  requested_by_detail?: {
    id?: string | number | null;
    full_name?: string | null;
    email?: string | null;
    department?: string | null;
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
  const roomPicName = Array.isArray(item.equipment_detail?.room_detail?.pics_detail)
    ? item.equipment_detail.room_detail.pics_detail
        .map((pic) => String(pic?.full_name ?? pic?.email ?? "").trim())
        .filter(Boolean)
        .join(", ") || "-"
    : "-";

  return {
    id: item.id ?? `use-${Math.random().toString(36).slice(2, 8)}`,
    code: String(item.code ?? "-"),
    equipmentId: String(item.equipment_detail?.id ?? item.equipment ?? ""),
    equipmentName: String(item.equipment_detail?.name ?? "-"),
    roomName: String(item.equipment_detail?.room_detail?.name ?? "-"),
    roomPicName,
    requesterId: String(item.requested_by_detail?.id ?? item.requested_by ?? ""),
    requesterName: String(requesterName),
    requesterDepartment: String(item.requested_by_detail?.department ?? "-"),
    approvedById: String(item.approved_by_detail?.id ?? item.approved_by ?? ""),
    approvedByName: String(approvedByName),
    status: String(item.status ?? "-"),
    purpose: String(item.purpose ?? "-"),
    quantity: String(item.quantity ?? "-"),
    startTime: String(item.start_time ?? "-"),
    endTime: String(item.end_time ?? "-"),
    createdAt: String(item.created_at ?? "-"),
    updatedAt: String(item.updated_at ?? "-"),
    approvedAt: String(item.approved_at ?? "-"),
    rejectedAt: String(item.rejected_at ?? "-"),
    rejectionNote: String(item.rejection_note ?? ""),
    expiredAt: String(item.expired_at ?? "-"),
    completedAt: String(item.completed_at ?? "-"),
    note: String(item.note ?? ""),
    requesterPhone: String(item.requester_phone ?? "-"),
    requesterMentor: String(item.requester_mentor ?? "-"),
    institution: String(item.institution ?? "-"),
    institutionAddress: String(item.institution_address ?? "-"),
  };
}

export function useUseDetail(
  id?: string | number | null,
  reloadKey = 0,
  options?: {
    enabled?: boolean;
    initialUseItem?: UseRow | null;
  },
) {
  const enabled = options?.enabled ?? true;
  const [useItem, setUseItem] = useState<UseRow | null>(
    options?.initialUseItem ?? null,
  );
  const [isLoading, setIsLoading] = useState(
    enabled && Boolean(id) && !options?.initialUseItem,
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof options?.initialUseItem === "undefined") return;
    setUseItem(options.initialUseItem ?? null);
  }, [options?.initialUseItem]);

  useEffect(() => {
    if (!enabled) {
      setError("");
      setIsLoading(false);
      return;
    }

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
  }, [enabled, id, reloadKey]);

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
        const listEndpoint =
          scope === "my" ? API_USES_MY : scope === "all" ? API_USES_ALL : API_USES;
        const url = new URL(listEndpoint, window.location.origin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(pageSize));
        if (filters.q) url.searchParams.set("q", filters.q);
        if (filters.status) url.searchParams.set("status", filters.status);
        if (filters.requestedBy && scope !== "my") {
          url.searchParams.set("requested_by", filters.requestedBy);
        }
        if (filters.department) {
          url.searchParams.set("department", filters.department);
        }
        if (filters.equipment) {
          url.searchParams.set("equipment", filters.equipment);
        }
        if (filters.room) {
          url.searchParams.set("room", filters.room);
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
  }, [
    page,
    pageSize,
    filters.q,
    filters.status,
    filters.department,
    filters.equipment,
    filters.room,
    filters.createdAfter,
    filters.createdBefore,
    filters.requestedBy,
    reloadKey,
    scope,
  ]);

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
