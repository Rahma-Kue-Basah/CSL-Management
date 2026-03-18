"use client";

import { useEffect, useState } from "react";

import { API_EQUIPMENTS_DROPDOWN } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type EquipmentOption = {
  id: string;
  label: string;
  quantity: number;
};

type ApiEquipmentOption = {
  id?: string | number | null;
  name?: string | null;
  quantity?: number | null;
};

export function useEquipmentOptions(status = "", room = "", enabled = true) {
  const [equipments, setEquipments] = useState<EquipmentOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setEquipments([]);
      setError("");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const url = new URL(API_EQUIPMENTS_DROPDOWN, window.location.origin);
        if (status) url.searchParams.set("status", status);
        if (room) url.searchParams.set("room", room);

        const response = await authFetch(url.toString(), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat opsi peralatan (${response.status})`);
        }

        const payload = (await response.json()) as ApiEquipmentOption[];
        const mapped = payload.map((item) => ({
          id: String(item.id ?? ""),
          label: String(item.name ?? "-"),
          quantity: Number(item.quantity ?? 0),
        }));
        setEquipments(mapped.filter((item) => item.id));
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
  }, [status, room, enabled]);

  return { equipments, isLoading, error };
}

export default useEquipmentOptions;
