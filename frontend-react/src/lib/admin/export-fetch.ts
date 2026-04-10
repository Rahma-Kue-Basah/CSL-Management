"use client";

import { authFetch } from "@/lib/auth";

type PaginatedResponse<TItem> = {
  count?: number;
  results?: TItem[];
};

type FetchAllPaginatedRecordsOptions<TItem, TRow> = {
  endpoint: string;
  filters?: Record<string, string>;
  mapItem: (item: TItem) => TRow;
};

export async function fetchExportRecords<TItem, TRow>({
  endpoint,
  filters = {},
  mapItem,
}: FetchAllPaginatedRecordsOptions<TItem, TRow>): Promise<TRow[]> {
  const url = new URL(endpoint, window.location.origin);

  Object.entries(filters).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
  });

  const response = await authFetch(url.toString(), { method: "GET" });
  if (!response.ok) {
    throw new Error(`Gagal memuat data export (${response.status})`);
  }

  const payload = (await response.json()) as PaginatedResponse<TItem> | TItem[];
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.results)
      ? payload.results
      : [];

  return list.map(mapItem);
}
