"use client";

import { useEffect, useRef, useState } from "react";

import { authFetch } from "@/lib/auth-fetch";

export function useRequestList({
  apiUrl,
  page,
  pageSize = 20,
  filters = {},
  buildParams,
  mapItem,
  errorMessage = "Terjadi kesalahan.",
}) {
  const [items, setItems] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const lastKeyRef = useRef(null);

  useEffect(() => {
    const key = JSON.stringify({ page, pageSize, filters });
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    const load = async () => {
      try {
        setIsLoading(true);
        setError("");
        const url = new URL(apiUrl);
        url.searchParams.set("page", page);
        url.searchParams.set("page_size", pageSize);
        if (buildParams) buildParams(url, filters);

        const resp = await authFetch(url.toString());
        if (!resp.ok) throw new Error(errorMessage);
        const data = await resp.json();
        const results = Array.isArray(data) ? data : data?.results || [];
        const mapped = mapItem ? results.map(mapItem) : results;
        setItems(mapped);
        setTotalCount(data?.count ?? mapped.length);
      } catch (err) {
        setError(err.message || errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [apiUrl, page, pageSize, filters, buildParams, mapItem, errorMessage]);

  return {
    items,
    setItems,
    totalCount,
    setTotalCount,
    isLoading,
    error,
    setError,
  };
}

export default useRequestList;
