"use client";

import { useEffect, useState } from "react";

import {
  API_PENGUJIAN_DETAIL,
  API_PENGUJIANS,
  API_PENGUJIANS_ALL,
  API_PENGUJIANS_MY,
} from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type PengujianFilters = {
  status?: string;
  requestedBy?: string;
  department?: string;
  createdAfter?: string;
  createdBefore?: string;
};

export type PengujianListScope = "default" | "my" | "all";

export type PengujianRow = {
  id: string | number;
  code: string;
  name: string;
  institution: string;
  institutionAddress: string;
  email: string;
  phoneNumber: string;
  sampleName: string;
  sampleType: string;
  sampleBrand: string;
  samplePackaging: string;
  sampleWeight: string;
  sampleQuantity: string;
  sampleTestingServing: string;
  sampleTestingMethod: string;
  sampleTestingType: string;
  status: string;
  requesterId: string;
  requesterName: string;
  requesterDepartment: string;
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
  institution_address?: string | null;
  email?: string | null;
  phone_number?: string | null;
  sample_name?: string | null;
  sample_type?: string | null;
  sample_brand?: string | null;
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
    department?: string | null;
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
  aggregates?: {
    total?: number;
    pending?: number;
    approved?: number;
    completed?: number;
    rejected?: number;
    expired?: number;
  } | null;
};

export type PengujianAggregates = {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
  expired: number;
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
    institutionAddress: String(item.institution_address ?? "-"),
    email: String(item.email ?? "-"),
    phoneNumber: String(item.phone_number ?? "-"),
    sampleName: String(item.sample_name ?? "-"),
    sampleType: String(item.sample_type ?? "-"),
    sampleBrand: String(item.sample_brand ?? "-"),
    samplePackaging: String(item.sample_packaging ?? "-"),
    sampleWeight: String(item.sample_weight ?? "-"),
    sampleQuantity: String(item.sample_quantity ?? "-"),
    sampleTestingServing: String(item.sample_testing_serving ?? "-"),
    sampleTestingMethod: String(item.sample_testing_method ?? "-"),
    sampleTestingType: String(item.sample_testing_type ?? "-"),
    status: String(item.status ?? "-"),
    requesterId: String(item.requested_by_detail?.id ?? item.requested_by ?? ""),
    requesterName: String(requesterName),
    requesterDepartment: String(item.requested_by_detail?.department ?? "-"),
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
  scope: PengujianListScope = "default",
) {
  const [pengujians, setPengujians] = useState<PengujianRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");
  const [aggregates, setAggregates] = useState<PengujianAggregates>({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    expired: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const listEndpoint =
          scope === "my"
            ? API_PENGUJIANS_MY
            : scope === "all"
              ? API_PENGUJIANS_ALL
              : API_PENGUJIANS;
        const url = new URL(listEndpoint, window.location.origin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(pageSize));
        if (filters.status) url.searchParams.set("status", filters.status);
        if (filters.requestedBy && scope !== "my") {
          url.searchParams.set("requested_by", filters.requestedBy);
        }
        if (filters.department) {
          url.searchParams.set("department", filters.department);
        }
        if (filters.createdAfter) {
          url.searchParams.set("created_after", filters.createdAfter);
        }
        if (filters.createdBefore) {
          url.searchParams.set("created_before", filters.createdBefore);
        }

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
        setAggregates({
          total: Array.isArray(payload) ? mapped.length : Number(payload.aggregates?.total ?? 0),
          pending: Array.isArray(payload) ? 0 : Number(payload.aggregates?.pending ?? 0),
          approved: Array.isArray(payload) ? 0 : Number(payload.aggregates?.approved ?? 0),
          completed: Array.isArray(payload) ? 0 : Number(payload.aggregates?.completed ?? 0),
          rejected: Array.isArray(payload) ? 0 : Number(payload.aggregates?.rejected ?? 0),
          expired: Array.isArray(payload) ? 0 : Number(payload.aggregates?.expired ?? 0),
        });
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
  }, [
    page,
    pageSize,
    filters.status,
    filters.requestedBy,
    filters.department,
    filters.createdAfter,
    filters.createdBefore,
    reloadKey,
    scope,
  ]);

  return {
    pengujians,
    setPengujians,
    totalCount,
    setTotalCount,
    aggregates,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}

export default usePengujians;
