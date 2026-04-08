"use client";

import { useState } from "react";
import { usersService } from "@/services/shared/resources/users.service";

export function useDeleteUser() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteUser = async (userId: number | string) => {
    if (!userId) return { ok: false, message: "User ID kosong" };

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const result = await usersService.remove(userId);

      if (result.ok || result.status === 204) {
        return { ok: true };
      }

      let message = `Gagal menghapus user (${result.status})`;
      const data = (result.data ?? {}) as { detail?: string };
      if (typeof data.detail === "string" && data.detail.trim()) {
        message = data.detail;
      }
      setErrorMessage(message);
      return { ok: false, message };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan jaringan.";
      setErrorMessage(message);
      return { ok: false, message };
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteUsers = async (userIds: Array<number | string>) => {
    const normalizedIds = userIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (!normalizedIds.length) {
      return { ok: false, message: "User ID kosong", deletedIds: [], failedIds: [] };
    }

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const result = await usersService.bulkRemove(normalizedIds);

      const data = (result.data ?? {}) as {
        detail?: string;
        deleted_count?: number;
        failed_count?: number;
        deleted_ids?: Array<number | string>;
        failed_ids?: Array<number | string>;
      };

      if (!result.ok) {
        const message =
          (typeof data.detail === "string" && data.detail.trim()) ||
          `Gagal menghapus user (${result.status})`;
        setErrorMessage(message);
        return { ok: false, message, deletedIds: [], failedIds: [] };
      }

      return {
        ok: true,
        deletedCount: Number(data.deleted_count ?? 0),
        failedCount: Number(data.failed_count ?? 0),
        deletedIds: Array.isArray(data.deleted_ids) ? data.deleted_ids : [],
        failedIds: Array.isArray(data.failed_ids) ? data.failed_ids : [],
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan jaringan.";
      setErrorMessage(message);
      return { ok: false, message, deletedIds: [], failedIds: [] };
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteUser, deleteUsers, isDeleting, errorMessage, setErrorMessage };
}

export default useDeleteUser;
