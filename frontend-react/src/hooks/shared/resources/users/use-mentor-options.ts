"use client";

import { useEffect, useState } from "react";
import {
  usersService,
  type MentorOption,
} from "@/services/shared/resources";

export type { MentorOption };

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
        const mapped = await usersService.getMentorOptions(controller.signal);
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
