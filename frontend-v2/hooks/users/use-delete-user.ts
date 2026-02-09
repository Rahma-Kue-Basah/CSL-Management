"use client";

import { useState } from "react";

import { API_AUTH_USERS } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export function useDeleteUser() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteUser = async (userId: number | string) => {
    if (!userId) return { ok: false, message: "User ID kosong" };

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(`${API_AUTH_USERS}${userId}/`, {
        method: "DELETE",
      });

      if (response.ok || response.status === 204) {
        return { ok: true };
      }

      let message = `Gagal menghapus user (${response.status})`;
      try {
        const data = (await response.json()) as { detail?: string };
        if (typeof data.detail === "string" && data.detail.trim()) {
          message = data.detail;
        }
      } catch {
        // ignore parse failure
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

  return { deleteUser, isDeleting, errorMessage, setErrorMessage };
}

export default useDeleteUser;

