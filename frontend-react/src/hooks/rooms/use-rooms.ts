"use client";

import { useEffect, useState } from "react";

import { API_BASE_URL, API_ROOM_DETAIL, API_ROOMS } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type RoomFilters = {
  floor?: string;
  pic?: string;
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
  picIds: string[];
  picNames: string[];
  imageId: string | number | null;
  imageUrl: string;
};

export type RoomDetail = RoomRow;

type ApiRoom = {
  id?: number | string | null;
  name?: string | null;
  number?: string | null;
  floor?: number | string | null;
  capacity?: number | string | null;
  description?: string | null;
  image?: string | number | null;
  pics?: Array<string | number | null> | null;
  pics_detail?: Array<{
    id?: string | number | null;
    full_name?: string | null;
    email?: string | null;
  }> | null;
  image_detail?: { url?: string | null } | null;
};

type ApiRoomsResponse = {
  count?: number;
  results?: ApiRoom[];
};

export function mapRoom(room: ApiRoom): RoomRow {
  const picIds = Array.isArray(room.pics)
    ? room.pics
        .filter((item): item is string | number => item !== null && item !== undefined)
        .map((item) => String(item))
    : [];
  const picNames = Array.isArray(room.pics_detail)
    ? room.pics_detail
        .map((item) => String(item?.full_name ?? item?.email ?? "").trim())
        .filter(Boolean)
    : [];

  return {
    id: room.id ?? `room-${Math.random().toString(36).slice(2, 8)}`,
    name: String(room.name ?? "-"),
    number: String(room.number ?? "-"),
    floor: String(room.floor ?? "-"),
    capacity: String(room.capacity ?? "-"),
    description: String(room.description ?? ""),
    picName: picNames.length ? picNames.join(", ") : "-",
    picIds,
    picNames,
    imageId: room.image ?? null,
    imageUrl: resolveAssetUrl(room.image_detail?.url ?? ""),
  };
}

function resolveAssetUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${API_BASE_URL}${value}`;
  return `${API_BASE_URL}/${value}`;
}

export function useRooms(page: number, pageSize = 10, filters: RoomFilters = {}, reloadKey = 0) {
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
        const url = new URL(API_ROOMS, window.location.origin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(pageSize));
        if (filters.floor) url.searchParams.set("floor", filters.floor);
        if (filters.pic) url.searchParams.set("pic", filters.pic);
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
  }, [page, pageSize, filters.floor, filters.pic, filters.search, reloadKey]);

  return { rooms, setRooms, totalCount, setTotalCount, isLoading, hasLoadedOnce, error, setError };
}

export function useRoomDetail(id?: string | number | null) {
  const [room, setRoom] = useState<RoomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setRoom(null);
      setError("ID ruangan tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await authFetch(API_ROOM_DETAIL(id), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat detail ruangan (${response.status})`);
        }

        const payload = (await response.json()) as ApiRoom & {
          image_detail?: { url?: string | null } | null;
        };
        const mapped = mapRoom(payload);
        setRoom(mapped);
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
    room,
    setRoom,
    isLoading,
    error,
    setError,
  };
}

export default useRooms;
