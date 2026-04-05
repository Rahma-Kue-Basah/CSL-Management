"use client";

import { useEffect, useState } from "react";

import { API_AUTH_MENTOR_USERS_DROPDOWN } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type MentorOption = {
  id: string;
  label: string;
};

type ApiMentorOption = {
  id?: string | number | null;
  name?: string | null;
  role?: string | null;
  department?: string | null;
  is_mentor?: boolean | null;
};

export function useMentorOptions(enabled = true) {
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setMentors([]);
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
        const response = await authFetch(API_AUTH_MENTOR_USERS_DROPDOWN, {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat dosen pembimbing (${response.status}).`);
        }

        const payload = (await response.json()) as ApiMentorOption[];
        const mapped = Array.isArray(payload)
          ? payload
              .map((item) => {
                if (!item.id) return null;

                return {
                  id: String(item.id),
                  label: String(item.name ?? "-"),
                } satisfies MentorOption;
              })
              .filter((item): item is MentorOption => item !== null)
          : [];

        setMentors(mapped);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(
          loadError instanceof Error ? loadError.message : "Terjadi kesalahan.",
        );
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

  return { mentors, isLoading, error };
}

export default useMentorOptions;
