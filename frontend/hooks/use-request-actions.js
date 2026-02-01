"use client";

import { useState } from "react";

import { authFetch } from "@/lib/auth-fetch";

export function useRequestActions({
  createUrl,
  detailUrl,
  buildPayload,
  parseError,
  messages,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createItem = async (payload) => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const body = buildPayload(payload);
      const resp = await authFetch(createUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (resp.ok) return { ok: true };

      let message = messages?.create || "Gagal membuat data.";
      try {
        const data = await resp.json();
        message = parseError ? parseError(data, message) : message;
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
      setIsSubmitting(false);
    }
  };

  const updateItem = async (id, payload) => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const body = buildPayload(payload);
      const resp = await authFetch(detailUrl(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (resp.ok) return { ok: true };

      let message = messages?.update || "Gagal memperbarui data.";
      try {
        const data = await resp.json();
        message = parseError ? parseError(data, message) : message;
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
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (id) => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const resp = await authFetch(detailUrl(id), {
        method: "DELETE",
      });
      if (resp.ok) return { ok: true };

      let message = messages?.delete || "Gagal menghapus data.";
      try {
        const data = await resp.json();
        message = parseError ? parseError(data, message) : message;
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
      setIsSubmitting(false);
    }
  };

  return {
    createItem,
    updateItem,
    deleteItem,
    isSubmitting,
    errorMessage,
    setErrorMessage,
  };
}

export default useRequestActions;
