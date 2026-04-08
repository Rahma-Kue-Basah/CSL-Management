"use client";

import { useEffect, useState } from "react";
import {
  roomsService,
  type RoomOption,
} from "@/services/shared/resources";

export type { RoomOption };

export function useRoomOptions(enabled = true) {
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setRooms([]);
      setIsLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const mapped = await roomsService.getOptions(controller.signal);
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
  }, [enabled]);

  return { rooms, isLoading, error };
}

export default useRoomOptions;
