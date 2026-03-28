"use client";

import { useEffect, useState } from "react";

import {
  API_BORROWS,
  API_BORROWS_ALL,
  API_BORROWS_MY,
  API_BORROW_DETAIL,
} from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type BorrowFilters = {
  status?: string;
  requestedBy?: string;
  createdAfter?: string;
  createdBefore?: string;
};

export type BorrowListScope = "default" | "my" | "all";

export type BorrowRow = {
  id: string | number;
  code: string;
  equipmentId: string;
  equipmentName: string;
  roomPicName: string;
  requesterId: string;
  requesterName: string;
  approvedById: string;
  approvedByName: string;
  status: string;
  purpose: string;
  quantity: string;
  startTime: string;
  endTime: string;
  endTimeActual: string;
  createdAt: string;
  updatedAt: string;
  note: string;
  inspectionNote: string;
};

type ApiBorrow = {
  id?: string | number | null;
  code?: string | null;
  status?: string | null;
  purpose?: string | null;
  note?: string | null;
  inspection_note?: string | null;
  quantity?: number | string | null;
  start_time?: string | null;
  end_time?: string | null;
  end_time_actual?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
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
  } | null;
  approved_by?: string | number | null;
  approved_by_detail?: {
    id?: string | number | null;
    full_name?: string | null;
    email?: string | null;
  } | null;
};

type ApiBorrowsResponse = {
  count?: number;
  results?: ApiBorrow[];
  aggregates?: {
    total?: number;
    pending?: number;
    approved?: number;
    rejected?: number;
    expired?: number;
    borrowed?: number;
    returned_pending_inspection?: number;
    returned?: number;
    overdue?: number;
    lost_damaged?: number;
  } | null;
};

export type BorrowAggregates = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  borrowed: number;
  returned_pending_inspection: number;
  returned: number;
  overdue: number;
  lost_damaged: number;
};

export function mapBorrow(item: ApiBorrow): BorrowRow {
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
    id: item.id ?? `borrow-${Math.random().toString(36).slice(2, 8)}`,
    code: String(item.code ?? "-"),
    equipmentId: String(item.equipment_detail?.id ?? item.equipment ?? ""),
    equipmentName: String(item.equipment_detail?.name ?? "-"),
    roomPicName,
    requesterId: String(item.requested_by_detail?.id ?? item.requested_by ?? ""),
    requesterName: String(requesterName),
    approvedById: String(item.approved_by_detail?.id ?? item.approved_by ?? ""),
    approvedByName: String(approvedByName),
    status: String(item.status ?? "-"),
    purpose: String(item.purpose ?? "-"),
    quantity: String(item.quantity ?? "-"),
    startTime: String(item.start_time ?? "-"),
    endTime: String(item.end_time ?? "-"),
    endTimeActual: String(item.end_time_actual ?? "-"),
    createdAt: String(item.created_at ?? "-"),
    updatedAt: String(item.updated_at ?? "-"),
    note: String(item.note ?? ""),
    inspectionNote: String(item.inspection_note ?? ""),
  };
}

export function useBorrowDetail(id?: string | number | null) {
  const [borrow, setBorrow] = useState<BorrowRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setBorrow(null);
      setError("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await authFetch(API_BORROW_DETAIL(id), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat detail peminjaman alat (${response.status})`);
        }

        const payload = (await response.json()) as ApiBorrow;
        setBorrow(mapBorrow(payload));
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
    borrow,
    setBorrow,
    isLoading,
    error,
    setError,
  };
}

export function useBorrows(
  page: number,
  pageSize = 10,
  filters: BorrowFilters = {},
  reloadKey = 0,
  scope: BorrowListScope = "default",
) {
  const [borrows, setBorrows] = useState<BorrowRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");
  const [aggregates, setAggregates] = useState<BorrowAggregates>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    borrowed: 0,
    returned_pending_inspection: 0,
    returned: 0,
    overdue: 0,
    lost_damaged: 0,
  });

  useEffect(() => {
    if (scope === "my" && !filters.requestedBy) {
      setBorrows([]);
      setTotalCount(0);
      setAggregates({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        expired: 0,
        borrowed: 0,
        returned_pending_inspection: 0,
        returned: 0,
        overdue: 0,
        lost_damaged: 0,
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
          scope === "my"
            ? API_BORROWS_MY
            : scope === "all"
              ? API_BORROWS_ALL
              : API_BORROWS;
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
        if (!response.ok) throw new Error(`Gagal memuat data peminjaman alat (${response.status})`);

        const payload = (await response.json()) as ApiBorrowsResponse | ApiBorrow[];
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.results)
            ? payload.results
            : [];
        const mapped = list.map(mapBorrow);

        setBorrows(mapped);
        setTotalCount(Array.isArray(payload) ? mapped.length : (payload.count ?? mapped.length));
        setAggregates({
          total: Array.isArray(payload) ? mapped.length : Number(payload.aggregates?.total ?? 0),
          pending: Array.isArray(payload) ? 0 : Number(payload.aggregates?.pending ?? 0),
          approved: Array.isArray(payload) ? 0 : Number(payload.aggregates?.approved ?? 0),
          rejected: Array.isArray(payload) ? 0 : Number(payload.aggregates?.rejected ?? 0),
          expired: Array.isArray(payload) ? 0 : Number(payload.aggregates?.expired ?? 0),
          borrowed: Array.isArray(payload) ? 0 : Number(payload.aggregates?.borrowed ?? 0),
          returned_pending_inspection: Array.isArray(payload)
            ? 0
            : Number(payload.aggregates?.returned_pending_inspection ?? 0),
          returned: Array.isArray(payload) ? 0 : Number(payload.aggregates?.returned ?? 0),
          overdue: Array.isArray(payload) ? 0 : Number(payload.aggregates?.overdue ?? 0),
          lost_damaged: Array.isArray(payload) ? 0 : Number(payload.aggregates?.lost_damaged ?? 0),
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
  }, [page, pageSize, filters.status, filters.requestedBy, filters.createdAfter, filters.createdBefore, reloadKey, scope]);

  return {
    borrows,
    setBorrows,
    totalCount,
    setTotalCount,
    aggregates,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}

export default useBorrows;
