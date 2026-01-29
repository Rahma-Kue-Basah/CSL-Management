"use client";

import { useEffect, useState } from "react";

import { API_ROOMS } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function useRoomOptions() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const url = new URL(API_ROOMS);
        url.searchParams.set("page", "1");
        url.searchParams.set("page_size", "200");
        const resp = await authFetch(url.toString());
        if (!resp.ok) throw new Error("Gagal memuat data ruangan.");
        const data = await resp.json();
        const results = Array.isArray(data) ? data : data?.results || [];
        const mapped = results.map((room) => ({
          id: room.id,
          label: `${room.name}${room.number ? ` (${room.number})` : ""}`,
        }));
        setRooms(mapped);
      } catch (err) {
        setError(err.message || "Terjadi kesalahan.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return {
    rooms,
    isLoading,
    error,
  };
}

export default useRoomOptions;
