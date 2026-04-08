"use client";

import { useEffect, useState } from "react";
import {
  adminHistoryService,
  type HistoryRequesterOption,
} from "@/services/admin";

export type { HistoryRequesterOption };

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
        const mapped = await adminHistoryService.getRequesterOptions(
          endpoint,
          controller.signal,
        );

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
