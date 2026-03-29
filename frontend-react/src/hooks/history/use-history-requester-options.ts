"use client";

import { useEffect, useState } from "react";

import { authFetch } from "@/lib/auth";

type ApiHistoryRequesterOption = {
  id?: string | number | null;
  full_name?: string | null;
  email?: string | null;
  department?: string | null;
};

export type HistoryRequesterOption = {
  id: string;
  label: string;
  email: string;
  department: string;
};

export function useHistoryRequesterOptions(endpoint: string, enabled = true) {
  const [requesters, setRequesters] = useState<HistoryRequesterOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setRequesters([]);
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
        const response = await authFetch(endpoint, {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat daftar pemohon (${response.status}).`);
        }

        const list = (await response.json()) as ApiHistoryRequesterOption[];
        const mapped = list
          .filter((item) => item.id)
          .map((item) => ({
            id: String(item.id),
            label: String(item.full_name ?? item.email ?? "-"),
            email: String(item.email ?? "-"),
            department: String(item.department ?? ""),
          }));

        setRequesters(mapped);
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
  }, [endpoint, enabled]);

  return { requesters, isLoading, error };
}

export default useHistoryRequesterOptions;
