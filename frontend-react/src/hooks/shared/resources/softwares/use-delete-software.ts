"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core";
import { softwaresService } from "@/services/shared/resources";

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
      const result = await softwaresService.remove(softwareId);

      if (result.ok || result.status === 204) {
        return { ok: true as const };
      }

      let message = `Gagal menghapus software (${result.status}).`;
      if (typeof result.data !== "undefined") {
        message = parseDeleteSoftwareError(result.data, message);
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
      const result = await softwaresService.bulkRemove(softwareIds);

      const fallback = `Gagal menghapus software terpilih (${result.ok ? 200 : result.status}).`;
      const data = (result.data ?? null) as
        | {
            detail?: string;
            deleted_ids?: Array<string | number>;
            deleted_count?: number;
            failed_count?: number;
          }
        | null;

      if (result.ok || result.status === 207) {
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
