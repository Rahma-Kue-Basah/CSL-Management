"use client";

import { useEffect, useState } from "react";

import {
  API_BOOKINGS,
  API_BOOKINGS_ALL,
  API_BOOKINGS_MY,
  API_BOOKING_DETAIL,
} from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type BookingFilters = {
  status?: string;
  createdAfter?: string;
  createdBefore?: string;
};

export type BookingListScope = "default" | "my" | "all";

export type BookingRow = {
  id: string | number;
  code: string;
  roomId: string;
  roomName: string;
  roomNumber: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  status: string;
  purpose: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  approvedById: string;
  approvedByName: string;
  approvedByEmail: string;
  equipmentId: string;
  equipmentName: string;
  equipmentQty: string;
  note: string;
};

type ApiBooking = {
  id?: string | number | null;
  code?: string | null;
  status?: string | null;
  purpose?: string | null;
  note?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  quantity_equipment?: number | string | null;
  room?: string | number | null;
  room_detail?: {
    id?: string | number | null;
    name?: string | null;
    number?: string | null;
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
  equipment?: string | number | null;
  equipment_detail?: {
    id?: string | number | null;
    name?: string | null;
  } | null;
};

type ApiBookingsResponse = {
  count?: number;
  results?: ApiBooking[];
};

export function mapBooking(item: ApiBooking): BookingRow {
  const requesterName =
    item.requested_by_detail?.full_name ||
    item.requested_by_detail?.email ||
    "-";
  const approvedByName =
    item.approved_by_detail?.full_name ||
    item.approved_by_detail?.email ||
    "-";

  return {
    id: item.id ?? `booking-${Math.random().toString(36).slice(2, 8)}`,
    code: String(item.code ?? "-"),
    roomId: String(item.room_detail?.id ?? item.room ?? ""),
    roomName: String(item.room_detail?.name ?? "-"),
    roomNumber: String(item.room_detail?.number ?? "-"),
    requesterId: String(item.requested_by_detail?.id ?? item.requested_by ?? ""),
    requesterName: String(requesterName),
    requesterEmail: String(item.requested_by_detail?.email ?? "-"),
    status: String(item.status ?? "-"),
    purpose: String(item.purpose ?? "-"),
    startTime: String(item.start_time ?? "-"),
    endTime: String(item.end_time ?? "-"),
    createdAt: String(item.created_at ?? "-"),
    updatedAt: String(item.updated_at ?? "-"),
    approvedById: String(item.approved_by_detail?.id ?? item.approved_by ?? ""),
    approvedByName: String(approvedByName),
    approvedByEmail: String(item.approved_by_detail?.email ?? "-"),
    equipmentId: String(item.equipment_detail?.id ?? item.equipment ?? ""),
    equipmentName: String(item.equipment_detail?.name ?? "-"),
    equipmentQty: String(item.quantity_equipment ?? "-"),
    note: String(item.note ?? ""),
  };
}

export function useBookingDetail(id?: string | number | null) {
  const [booking, setBooking] = useState<BookingRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setBooking(null);
      setError("ID booking tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await authFetch(API_BOOKING_DETAIL(id), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat detail booking (${response.status})`);
        }

        const payload = (await response.json()) as ApiBooking;
        setBooking(mapBooking(payload));
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
    booking,
    setBooking,
    isLoading,
    error,
    setError,
  };
}

export function useBookings(
  page: number,
  pageSize = 10,
  filters: BookingFilters = {},
  reloadKey = 0,
  scope: BookingListScope = "default",
) {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
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
        const listEndpoint =
          scope === "my" ? API_BOOKINGS_MY : scope === "all" ? API_BOOKINGS_ALL : API_BOOKINGS;
        const url = new URL(listEndpoint, window.location.origin);
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
        if (!response.ok) throw new Error(`Gagal memuat data booking (${response.status})`);

        const payload = (await response.json()) as ApiBookingsResponse | ApiBooking[];
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.results)
            ? payload.results
            : [];
        const mapped = list.map(mapBooking);

        setBookings(mapped);
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
  }, [page, pageSize, filters.status, filters.createdAfter, filters.createdBefore, reloadKey, scope]);

  return {
    bookings,
    setBookings,
    totalCount,
    setTotalCount,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}

export default useBookings;
