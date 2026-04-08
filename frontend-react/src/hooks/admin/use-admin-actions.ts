"use client";

import { useEffect, useState } from "react";
import {
  adminActionsService,
  type AdminAction,
} from "@/services/admin";

export type { AdminAction };

export function useAdminActions() {
  const [recentActions, setRecentActions] = useState<AdminAction[]>([]);
  const [myActions, setMyActions] = useState<AdminAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [recent, mine] = await Promise.all([
          adminActionsService.getRecent(controller.signal),
          adminActionsService.getMine(controller.signal),
        ]);

        setRecentActions(Array.isArray(recent) ? recent : []);
        setMyActions(Array.isArray(mine) ? mine : []);
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

  return { recentActions, myActions, isLoading, error };
}

export default useAdminActions;
