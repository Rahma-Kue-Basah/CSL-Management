"use client";

import { useState } from "react";

import { API_AUTH_USERS } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function useDeleteUser() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const deleteUser = async (userId) => {
    if (!userId) return { ok: false, message: "User ID kosong" };

    setIsDeleting(true);
    setErrorMessage("");

    try {
      const response = await authFetch(`${API_AUTH_USERS}${userId}/`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok || response.status === 204) {
        return { ok: true };
      }

      let message = `Gagal menghapus user (${response.status})`;
      try {
        const data = await response.json();
        if (typeof data.detail === "string") message = data.detail;
      } catch (_) {
        // ignore parse error
      }

      setErrorMessage(message);
      return { ok: false, message };
    } catch (error) {
      const message = error.message || "Terjadi kesalahan jaringan. Coba lagi.";
      setErrorMessage(message);
      return { ok: false, message };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteUser,
    isDeleting,
    errorMessage,
    setErrorMessage,
  };
}

export default useDeleteUser;
