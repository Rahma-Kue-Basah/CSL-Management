"use client";

import { useEffect, useState } from "react";

import { API_PENGUJIAN_DETAIL, API_PENGUJIANS } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type PengujianFilters = {
  status?: string;
};

export type PengujianRow = {
  id: string | number;
  code: string;
  name: string;
  institution: string;
  email: string;
  phoneNumber: string;
  sampleType: string;
  sampleShape: string;
  sampleCondition: string;
  samplePackaging: string;
  sampleWeight: string;
  sampleQuantity: string;
  sampleTestingServing: string;
  sampleTestingMethod: string;
  sampleTestingType: string;
  status: string;
  requesterId: string;
  requesterName: string;
  approvedById: string;
  approvedByName: string;
  createdAt: string;
  updatedAt: string;
};

type ApiPengujian = {
  id?: string | number | null;
  code?: string | null;
  name?: string | null;
  institution?: string | null;
  email?: string | null;
  phone_number?: string | null;
  sample_type?: string | null;
  sample_shape?: string | null;
  sample_condition?: string | null;
  sample_packaging?: string | null;
  sample_weight?: string | null;
  sample_quantity?: string | null;
  sample_testing_serving?: string | null;
  sample_testing_method?: string | null;
  sample_testing_type?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  requested_by?: string | number | null;
  requested_by_detail?: {
    id?: string | number | null;
    full_name?: string | null;
    email?: string | null;
  } | null;
  approved_by?: string | number | null;
  approved_by_detail?: {
    id?: string | number | null;
    full_name?: string | null;
    email?: string | null;
  } | null;
};

type ApiPengujiansResponse = {
  count?: number;
  results?: ApiPengujian[];
};

export function mapPengujian(item: ApiPengujian): PengujianRow {
  const requesterName =
    item.requested_by_detail?.full_name ||
    item.requested_by_detail?.email ||
    "-";
  const approvedByName =
    item.approved_by_detail?.full_name ||
    item.approved_by_detail?.email ||
    "-";

  return {
    id: item.id ?? `pengujian-${Math.random().toString(36).slice(2, 8)}`,
    code: String(item.code ?? "-"),
    name: String(item.name ?? "-"),
    institution: String(item.institution ?? "-"),
    email: String(item.email ?? "-"),
    phoneNumber: String(item.phone_number ?? "-"),
    sampleType: String(item.sample_type ?? "-"),
    sampleShape: String(item.sample_shape ?? "-"),
    sampleCondition: String(item.sample_condition ?? "-"),
    samplePackaging: String(item.sample_packaging ?? "-"),
    sampleWeight: String(item.sample_weight ?? "-"),
    sampleQuantity: String(item.sample_quantity ?? "-"),
    sampleTestingServing: String(item.sample_testing_serving ?? "-"),
    sampleTestingMethod: String(item.sample_testing_method ?? "-"),
    sampleTestingType: String(item.sample_testing_type ?? "-"),
    status: String(item.status ?? "-"),
    requesterId: String(item.requested_by_detail?.id ?? item.requested_by ?? ""),
    requesterName: String(requesterName),
    approvedById: String(item.approved_by_detail?.id ?? item.approved_by ?? ""),
    approvedByName: String(approvedByName),
    createdAt: String(item.created_at ?? "-"),
    updatedAt: String(item.updated_at ?? "-"),
  };
}

export function usePengujianDetail(id?: string | number | null) {
  const [pengujian, setPengujian] = useState<PengujianRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setPengujian(null);
      setError("ID pengujian tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await authFetch(API_PENGUJIAN_DETAIL(id), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat detail pengujian sampel (${response.status})`);
        }

        const payload = (await response.json()) as ApiPengujian;
        setPengujian(mapPengujian(payload));
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
    pengujian,
    setPengujian,
    isLoading,
    error,
    setError,
  };
}

export function usePengujians(
  page: number,
  pageSize = 10,
  filters: PengujianFilters = {},
  reloadKey = 0,
) {
  const [pengujians, setPengujians] = useState<PengujianRow[]>([]);
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
        const url = new URL(API_PENGUJIANS, window.location.origin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(pageSize));
        if (filters.status) url.searchParams.set("status", filters.status);

        const response = await authFetch(url.toString(), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Gagal memuat data pengujian sampel (${response.status})`);

        const payload = (await response.json()) as ApiPengujiansResponse | ApiPengujian[];
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.results)
            ? payload.results
            : [];
        const mapped = list.map(mapPengujian);

        setPengujians(mapped);
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
  }, [page, pageSize, filters.status, reloadKey]);

  return {
    pengujians,
    setPengujians,
    totalCount,
    setTotalCount,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}

export default usePengujians;
