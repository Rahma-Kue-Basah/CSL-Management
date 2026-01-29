"use client";

import { useEffect, useRef, useState } from "react";

import { API_EQUIPMENTS } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function useEquipments(page, pageSize = 20, filters = {}) {
  const [equipments, setEquipments] = useState([]);
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
        const url = new URL(API_EQUIPMENTS);
        url.searchParams.set("page", page);
        url.searchParams.set("page_size", pageSize);
        if (filters.status) url.searchParams.set("status", filters.status);
        if (filters.category) url.searchParams.set("category", filters.category);
        if (filters.is_moveable !== "")
          url.searchParams.set("is_moveable", filters.is_moveable);

        const resp = await authFetch(url.toString());
        if (!resp.ok) throw new Error("Gagal memuat data equipment.");
        const data = await resp.json();
        const results = Array.isArray(data) ? data : data?.results || [];
        const mapped = results.map((item) => ({
          id: item.id,
          name: item.name || "-",
          category: item.category || "-",
          status: item.status || "-",
          quantity: item.quantity ?? "-",
          isMoveable: item.is_moveable ?? false,
          description: item.description || "",
          room: item.room || null,
          roomDetail: item.room_detail || null,
          imageDetail: item.image_detail || null,
        }));
        setEquipments(mapped);
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
    equipments,
    setEquipments,
    totalCount,
    setTotalCount,
    isLoading,
    error,
    setError,
  };
}

export default useEquipments;
