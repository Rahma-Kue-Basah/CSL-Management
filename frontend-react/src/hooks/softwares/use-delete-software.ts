"use client";

import { useState } from "react";

import { API_SOFTWARE_DETAIL, API_SOFTWARES_BULK_DELETE } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

function parseDeleteSoftwareError(data: unknown, fallback = "Gagal menghapus software.") {
  return extractApiErrorMessage(data, fallback);
}

export function useDeleteSoftware() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteSoftware = async (softwareId: string | number) => {
    if (!softwareId) {
      const message = "Software ID kosong.";
      setErrorMessage(message);
      return { ok: false as const, message };
    }

    setErrorMessage("");
    setIsDeleting(true);

    try {
      const response = await authFetch(API_SOFTWARE_DETAIL(softwareId), {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        return { ok: true as const };
      }

      let message = `Gagal menghapus software (${response.status}).`;
      try {
        const data = (await response.json()) as unknown;
        message = parseDeleteSoftwareError(data, message);
      } catch {
        // ignore parse error
      }

      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteSoftwares = async (softwareIds: Array<string | number>) => {
    if (!softwareIds.length) {
      const message = "Pilih minimal satu software.";
      setErrorMessage(message);
      return { ok: false as const, message };
    }

    setErrorMessage("");
    setIsDeleting(true);

    try {
      const response = await authFetch(API_SOFTWARES_BULK_DELETE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: softwareIds }),
      });

      const fallback = `Gagal menghapus software terpilih (${response.status}).`;
      const data = (await response.json().catch(() => null)) as
        | {
            detail?: string;
            deleted_ids?: Array<string | number>;
            deleted_count?: number;
            failed_count?: number;
          }
        | null;

      if (response.ok || response.status === 207) {
        return {
          ok: true as const,
          deletedIds: Array.isArray(data?.deleted_ids) ? data.deleted_ids : [],
          deletedCount: Number(data?.deleted_count ?? 0),
          failedCount: Number(data?.failed_count ?? 0),
          message: typeof data?.detail === "string" ? data.detail : undefined,
        };
      }

      const message = data ? parseDeleteSoftwareError(data, fallback) : fallback;
      setErrorMessage(message);
      return { ok: false as const, message };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false as const, message };
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteSoftware, deleteSoftwares, isDeleting, errorMessage, setErrorMessage };
}

export default useDeleteSoftware;
