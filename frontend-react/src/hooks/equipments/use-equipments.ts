"use client";

import { useEffect, useState } from "react";

import { API_EQUIPMENTS } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type EquipmentFilters = {
  status?: string;
  category?: string;
  room?: string;
  is_moveable?: string;
  search?: string;
};

export type EquipmentRow = {
  id: number | string;
  name: string;
  category: string;
  status: string;
  quantity: string;
  roomName: string;
  isMoveable: boolean;
};

type ApiEquipment = {
  id?: number | string | null;
  name?: string | null;
  category?: string | null;
  status?: string | null;
  quantity?: number | string | null;
  is_moveable?: boolean | null;
  room_detail?: { name?: string | null } | null;
  room?: string | number | null;
};

type ApiEquipmentsResponse = {
  count?: number;
  results?: ApiEquipment[];
};

function mapEquipment(item: ApiEquipment): EquipmentRow {
  return {
    id: item.id ?? `eq-${Math.random().toString(36).slice(2, 8)}`,
    name: String(item.name ?? "-"),
    category: String(item.category ?? "-"),
    status: String(item.status ?? "-"),
    quantity: String(item.quantity ?? "-"),
    roomName: String(item.room_detail?.name ?? item.room ?? "-"),
    isMoveable: Boolean(item.is_moveable),
  };
}

export function useEquipments(page: number, pageSize = 10, filters: EquipmentFilters = {}, reloadKey = 0) {
  const [equipments, setEquipments] = useState<EquipmentRow[]>([]);
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
        const url = new URL(API_EQUIPMENTS, window.location.origin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(pageSize));
        if (filters.status) url.searchParams.set("status", filters.status);
        if (filters.category) url.searchParams.set("category", filters.category);
        if (filters.room) url.searchParams.set("room", filters.room);
        if (filters.is_moveable !== undefined && filters.is_moveable !== "") {
          url.searchParams.set("is_moveable", filters.is_moveable);
        }
        if (filters.search) url.searchParams.set("search", filters.search);

        const response = await authFetch(url.toString(), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Gagal memuat data peralatan (${response.status})`);

        const payload = (await response.json()) as ApiEquipmentsResponse | ApiEquipment[];
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.results)
            ? payload.results
            : [];
        const mapped = list.map(mapEquipment);

        setEquipments(mapped);
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
  }, [page, pageSize, filters.status, filters.category, filters.room, filters.is_moveable, filters.search, reloadKey]);

  return {
    equipments,
    setEquipments,
    totalCount,
    setTotalCount,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}

export default useEquipments;
