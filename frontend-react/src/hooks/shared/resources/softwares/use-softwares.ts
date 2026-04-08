"use client";

import { useEffect, useState } from "react";
import {
  mapSoftware,
  softwaresService,
  type SoftwareDetail,
  type SoftwareFilters,
  type SoftwareRow,
} from "@/services/shared/resources/softwares.service";

export type { SoftwareDetail, SoftwareFilters, SoftwareRow };
export { mapSoftware };

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
        const payload = await softwaresService.getList(
          page,
          pageSize,
          filters,
          controller.signal,
        );
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
        const payload = await softwaresService.getDetail(id, controller.signal);
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
