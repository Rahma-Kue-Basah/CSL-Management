"use client";

import { useEffect, useState } from "react";

import { API_SOFTWARE_DETAIL, API_SOFTWARES } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type SoftwareFilters = {
  equipment?: string;
  room?: string;
  pic?: string;
  search?: string;
};

export type SoftwareRow = {
  id: number | string;
  name: string;
  description: string;
  version: string;
  licenseInfo: string;
  licenseExpiration: string;
  equipmentId: string;
  equipmentName: string;
  roomName: string;
};

export type SoftwareDetail = SoftwareRow;

type ApiSoftware = {
  id?: number | string | null;
  name?: string | null;
  description?: string | null;
  version?: string | null;
  license_info?: string | null;
  license_expiration?: string | null;
  equipment?: string | number | null;
  equipment_detail?: {
    name?: string | null;
    room_detail?: { name?: string | null } | null;
  } | null;
};

type ApiSoftwaresResponse = {
  count?: number;
  results?: ApiSoftware[];
};

export function mapSoftware(item: ApiSoftware): SoftwareRow {
  return {
    id: item.id ?? `sw-${Math.random().toString(36).slice(2, 8)}`,
    name: String(item.name ?? "-"),
    description: String(item.description ?? ""),
    version: String(item.version ?? ""),
    licenseInfo: String(item.license_info ?? ""),
    licenseExpiration: String(item.license_expiration ?? ""),
    equipmentId: String(item.equipment ?? ""),
    equipmentName: String(item.equipment_detail?.name ?? item.equipment ?? "-"),
    roomName: String(item.equipment_detail?.room_detail?.name ?? "-"),
  };
}

export function useSoftwares(page: number, pageSize = 10, filters: SoftwareFilters = {}, reloadKey = 0) {
  const [softwares, setSoftwares] = useState<SoftwareRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const url = new URL(API_SOFTWARES, window.location.origin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(pageSize));
        if (filters.equipment) url.searchParams.set("equipment", filters.equipment);
        if (filters.room) url.searchParams.set("room", filters.room);
        if (filters.pic) url.searchParams.set("pic", filters.pic);
        if (filters.search) url.searchParams.set("search", filters.search);

        const response = await authFetch(url.toString(), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Gagal memuat data software (${response.status})`);

        const payload = (await response.json()) as ApiSoftwaresResponse | ApiSoftware[];
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.results)
            ? payload.results
            : [];
        const mapped = list.map(mapSoftware);

        setSoftwares(mapped);
        setTotalCount(Array.isArray(payload) ? mapped.length : (payload.count ?? mapped.length));
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        if (isAborted || controller.signal.aborted) return;
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    };

    void load();

    return () => {
      isAborted = true;
      controller.abort();
    };
  }, [page, pageSize, filters.equipment, filters.room, filters.pic, filters.search, reloadKey]);

  return {
    softwares,
    setSoftwares,
    totalCount,
    setTotalCount,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}

export function useSoftwareDetail(id?: string | number | null) {
  const [software, setSoftware] = useState<SoftwareDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setSoftware(null);
      setError("ID software tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await authFetch(API_SOFTWARE_DETAIL(id), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat detail software (${response.status})`);
        }

        const payload = (await response.json()) as ApiSoftware;
        setSoftware(mapSoftware(payload));
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
  }, [id]);

  return {
    software,
    setSoftware,
    isLoading,
    error,
    setError,
  };
}

export default useSoftwares;
