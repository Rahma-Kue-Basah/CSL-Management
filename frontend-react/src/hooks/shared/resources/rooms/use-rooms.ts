"use client";

import { useEffect, useState } from "react";
import {
  mapRoom,
  roomsService,
  type RoomDetail,
  type RoomFilters,
  type RoomRow,
} from "@/services/shared/resources";

export type { RoomDetail, RoomFilters, RoomRow };
export { mapRoom };

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
        const payload = await roomsService.getList(
          page,
          pageSize,
          filters,
          controller.signal,
        );
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
        const payload = await roomsService.getDetail(id, controller.signal);
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
