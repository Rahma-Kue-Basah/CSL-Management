"use client";

import { useEffect, useState } from "react";

import { API_ROOMS_DROPDOWN } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type ApiRoomOption = { id?: string | number | null; name?: string | null };

export type RoomOption = {
  id: string;
  label: string;
};

export function useRoomOptions() {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await authFetch(API_ROOMS_DROPDOWN, {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Gagal memuat data ruangan (${response.status}).`);

        const list = (await response.json()) as ApiRoomOption[];

        const mapped = list
          .filter((room) => room.id)
          .map((room) => ({
            id: String(room.id),
            label: String(room.name ?? "-"),
          }));

        setRooms(mapped);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Terjadi kesalahan.");
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
  }, []);

  return { rooms, isLoading, error };
}

export default useRoomOptions;
