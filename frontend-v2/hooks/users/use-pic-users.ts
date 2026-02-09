"use client";

import { useEffect, useState } from "react";

import { API_AUTH_PIC_USERS_DROPDOWN } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type ApiPicUser = {
  id?: string | number | null;
  name?: string | null;
};

export type PicUser = {
  id: string;
  name: string;
};

function mapPicUser(user: ApiPicUser): PicUser | null {
  if (!user.id) return null;

  return {
    id: String(user.id),
    name: String(user.name ?? "-"),
  };
}

export function usePicUsers(enabled = true) {
  const [picUsers, setPicUsers] = useState<PicUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      setError("");
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const loadPicUsers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await authFetch(API_AUTH_PIC_USERS_DROPDOWN, {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat data PIC (${response.status})`);
        }

        const list = (await response.json()) as ApiPicUser[];

        setPicUsers(list.map(mapPicUser).filter((item): item is PicUser => item !== null));
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Terjadi kesalahan saat memuat PIC.");
      } finally {
        if (isAborted || controller.signal.aborted) return;
        setIsLoading(false);
      }
    };

    void loadPicUsers();

    return () => {
      isAborted = true;
      controller.abort();
    };
  }, [enabled]);

  return { picUsers, isLoading, error };
}

export default usePicUsers;
