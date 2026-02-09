"use client";

import { useEffect, useState } from "react";

import { API_AUTH_ADMIN_ACTIONS_MY, API_AUTH_ADMIN_ACTIONS_RECENT } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type AdminAction = {
  id: number;
  action_time: string;
  action: "create" | "update" | "delete" | "unknown";
  actor: string;
  target: string;
  object_id: string;
  object_repr: string;
  change_message: string;
};

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
        const [recentResponse, myResponse] = await Promise.all([
          authFetch(API_AUTH_ADMIN_ACTIONS_RECENT, { method: "GET", signal: controller.signal }),
          authFetch(API_AUTH_ADMIN_ACTIONS_MY, { method: "GET", signal: controller.signal }),
        ]);

        if (!recentResponse.ok) {
          throw new Error(`Gagal memuat recent actions (${recentResponse.status})`);
        }
        if (!myResponse.ok) {
          throw new Error(`Gagal memuat my actions (${myResponse.status})`);
        }

        const recent = (await recentResponse.json()) as AdminAction[];
        const mine = (await myResponse.json()) as AdminAction[];

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
