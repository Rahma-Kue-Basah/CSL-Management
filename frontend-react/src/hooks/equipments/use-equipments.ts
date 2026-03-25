"use client";

import { useEffect, useState } from "react";

import { API_BASE_URL, API_EQUIPMENT_DETAIL, API_EQUIPMENTS } from "@/constants/api";
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
  description: string;
  category: string;
  status: string;
  quantity: string;
  roomId: string;
  roomName: string;
  isMoveable: boolean;
  imageId: string | number | null;
  imageUrl: string;
};

export type EquipmentDetail = EquipmentRow;

type ApiEquipment = {
  id?: number | string | null;
  name?: string | null;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  quantity?: number | string | null;
  is_moveable?: boolean | null;
  room_detail?: { name?: string | null } | null;
  room?: string | number | null;
  image?: string | number | null;
  image_detail?: { url?: string | null } | null;
};

type ApiEquipmentsResponse = {
  count?: number;
  results?: ApiEquipment[];
};

export function mapEquipment(item: ApiEquipment): EquipmentRow {
  return {
    id: item.id ?? `eq-${Math.random().toString(36).slice(2, 8)}`,
    name: String(item.name ?? "-"),
    description: String(item.description ?? ""),
    category: String(item.category ?? "-"),
    status: String(item.status ?? "-"),
    quantity: String(item.quantity ?? "-"),
    roomId: String(item.room ?? ""),
    roomName: String(item.room_detail?.name ?? item.room ?? "-"),
    isMoveable: Boolean(item.is_moveable),
    imageId: item.image ?? null,
    imageUrl: resolveAssetUrl(item.image_detail?.url ?? ""),
  };
}

function resolveAssetUrl(value: string | null | undefined) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
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

export function useEquipmentDetail(id?: string | number | null) {
  const [equipment, setEquipment] = useState<EquipmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setEquipment(null);
      setError("ID peralatan tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await authFetch(API_EQUIPMENT_DETAIL(id), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat detail peralatan (${response.status})`);
        }

        const payload = (await response.json()) as ApiEquipment & {
          description?: string | null;
          image_detail?: { url?: string | null } | null;
        };
        const mapped = mapEquipment(payload);
        setEquipment(mapped);
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
    equipment,
    setEquipment,
    isLoading,
    error,
    setError,
  };
}

export default useEquipments;
