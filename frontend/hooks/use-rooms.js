"use client";

import { useEffect, useRef, useState } from "react";

import { API_ROOMS } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function useRooms(page, pageSize = 20, filters = {}) {
  const [rooms, setRooms] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const lastKeyRef = useRef(null);

  useEffect(() => {
    const key = JSON.stringify({ page, pageSize, filters });
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    const load = async () => {
      try {
        setIsLoading(true);
        setError("");
        const url = new URL(API_ROOMS);
        url.searchParams.set("page", page);
        url.searchParams.set("page_size", pageSize);
        if (filters.pic) url.searchParams.set("pic", filters.pic);
        if (filters.floor) url.searchParams.set("floor", filters.floor);

        const resp = await authFetch(url.toString());
        if (!resp.ok) throw new Error("Gagal memuat data ruangan.");
        const data = await resp.json();
        const results = Array.isArray(data) ? data : data?.results || [];
        const mapped = results.map((room) => ({
          id: room.id,
          name: room.name || "-",
          number: room.number || "-",
          floor: room.floor ?? "-",
          capacity: room.capacity ?? "-",
          description: room.description || "",
          picDetail: room.pic_detail || null,
          imageDetail: room.image_detail || null,
        }));
        setRooms(mapped);
        setTotalCount(data?.count ?? mapped.length);
      } catch (err) {
        setError(err.message || "Terjadi kesalahan.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [page, pageSize, filters]);

  return {
    rooms,
    setRooms,
    totalCount,
    setTotalCount,
    isLoading,
    error,
    setError,
  };
}

export default useRooms;
