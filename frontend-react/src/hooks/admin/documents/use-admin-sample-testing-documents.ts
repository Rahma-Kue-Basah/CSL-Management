"use client";

import { useEffect, useState } from "react";
import type {
  SampleTestingDocumentType,
} from "@/hooks/sample-testing";
import {
  sampleTestingDocumentsService,
  type AdminSampleTestingDocumentGroup,
} from "@/services/admin";

export type { AdminSampleTestingDocumentGroup };

export function useAdminSampleTestingDocuments({
  page,
  pageSize,
  documentTypes,
  search,
  status,
  requestedBy,
  department,
  createdAfter,
  createdBefore,
  enabled = true,
  ordering,
}: {
  page: number;
  pageSize: number;
  documentTypes: SampleTestingDocumentType[];
  search?: string;
  status?: string;
  requestedBy?: string;
  department?: string;
  createdAfter?: string;
  createdBefore?: string;
  enabled?: boolean;
  ordering?: string;
}) {
  const [groups, setGroups] = useState<AdminSampleTestingDocumentGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(enabled);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || documentTypes.length === 0) {
      setGroups([]);
      setTotalCount(0);
      setError("");
      setIsLoading(false);
      setHasLoadedOnce(true);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const result = await sampleTestingDocumentsService.getList({
          page,
          pageSize,
          documentTypes,
          search,
          status,
          requestedBy,
          department,
          createdAfter,
          createdBefore,
          ordering,
          signal: controller.signal,
        });

        setGroups(result.groups);
        setTotalCount(result.totalCount);
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
    documentTypes,
    search,
    status,
    requestedBy,
    department,
    createdAfter,
    createdBefore,
    enabled,
    ordering,
  ]);

  return {
    groups,
    totalCount,
    isLoading,
    hasLoadedOnce,
    error,
  };
}
