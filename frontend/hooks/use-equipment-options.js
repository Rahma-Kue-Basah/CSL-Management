"use client";

import { useEffect, useState } from "react";

import { API_EQUIPMENTS } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function useEquipmentOptions() {
  const [equipments, setEquipments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const url = new URL(API_EQUIPMENTS);
        url.searchParams.set("page", "1");
        url.searchParams.set("page_size", "200");
        const resp = await authFetch(url.toString());
        if (!resp.ok) throw new Error("Gagal memuat data equipment.");
        const data = await resp.json();
        const results = Array.isArray(data) ? data : data?.results || [];
        const mapped = results.map((item) => ({
          id: item.id,
          label: item.name || "-",
        }));
        setEquipments(mapped);
      } catch (err) {
        setError(err.message || "Terjadi kesalahan.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return {
    equipments,
    isLoading,
    error,
  };
}

export default useEquipmentOptions;
