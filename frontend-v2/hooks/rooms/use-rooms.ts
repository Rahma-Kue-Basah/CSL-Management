"use client";

import { useEffect, useState } from "react";

import { API_ROOMS } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type RoomFilters = {
  floor?: string;
  search?: string;
};

export type RoomRow = {
  id: number | string;
  name: string;
  number: string;
  floor: string;
  capacity: string;
  description: string;
  picName: string;
};

type ApiRoom = {
  id?: number | string | null;
  name?: string | null;
  number?: string | null;
  floor?: number | string | null;
  capacity?: number | string | null;
  description?: string | null;
  pic_detail?: {
    full_name?: string | null;
    email?: string | null;
  } | null;
};

type ApiRoomsResponse = {
  count?: number;
  results?: ApiRoom[];
};

function mapRoom(room: ApiRoom): RoomRow {
  return {
    id: room.id ?? `room-${Math.random().toString(36).slice(2, 8)}`,
    name: String(room.name ?? "-"),
    number: String(room.number ?? "-"),
    floor: String(room.floor ?? "-"),
    capacity: String(room.capacity ?? "-"),
    description: String(room.description ?? ""),
    picName: String(room.pic_detail?.full_name ?? room.pic_detail?.email ?? "-"),
  };
}

export function useRooms(page: number, pageSize = 10, filters: RoomFilters = {}) {
  const [rooms, setRooms] = useState<RoomRow[]>([]);
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
        const url = new URL(API_ROOMS);
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(pageSize));
        if (filters.floor) url.searchParams.set("floor", filters.floor);
        if (filters.search) url.searchParams.set("search", filters.search);

        const response = await authFetch(url.toString(), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Gagal memuat data ruangan (${response.status})`);

        const payload = (await response.json()) as ApiRoomsResponse | ApiRoom[];
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.results)
            ? payload.results
            : [];
        const mapped = list.map(mapRoom);

        setRooms(mapped);
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
  }, [page, pageSize, filters.floor, filters.search]);

  return { rooms, setRooms, totalCount, setTotalCount, isLoading, hasLoadedOnce, error, setError };
}

export default useRooms;
