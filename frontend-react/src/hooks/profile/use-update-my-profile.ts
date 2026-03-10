"use client";

import { useState } from "react";

import { API_AUTH_USER_PROFILE_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth";

type UpdateMyProfilePayload = {
  full_name: string;
  department?: string | null;
  batch?: string | null;
  id_number?: string | null;
};

type UpdateProfileErrorResponse = {
  detail?: string;
  full_name?: string[];
  department?: string[];
  batch?: string[];
  id_number?: string[];
};

export function useUpdateMyProfile() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const updateMyProfile = async (
    profileId: string | number,
    payload: UpdateMyProfilePayload,
  ) => {
    setMessage("");
    if (!profileId) {
      throw new Error("ID profile tidak ditemukan.");
    }

    setIsSubmitting(true);
    try {
      const response = await authFetch(API_AUTH_USER_PROFILE_DETAIL(profileId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response
        .json()
        .catch(() => ({}))) as UpdateProfileErrorResponse;

      if (!response.ok) {
        const errorMessage =
          data?.detail ||
          data?.full_name?.[0] ||
          data?.department?.[0] ||
          data?.batch?.[0] ||
          data?.id_number?.[0] ||
          `Gagal memperbarui profil (${response.status}).`;
        throw new Error(errorMessage);
      }

      const cachedRaw =
        typeof window !== "undefined"
          ? window.localStorage.getItem("profile")
          : null;
      const cached = cachedRaw
        ? (JSON.parse(cachedRaw) as Record<string, unknown>)
        : {};

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "profile",
          JSON.stringify({
            ...cached,
            name: payload.full_name,
            department: payload.department ?? null,
            batch: payload.batch ?? null,
            id_number: payload.id_number ?? null,
          }),
        );
        window.localStorage.setItem("profile_cached_at", String(Date.now()));
      }

      setMessage("Profil berhasil diperbarui.");
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan jaringan. Coba lagi.";
      setMessage(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    updateMyProfile,
    isSubmitting,
    message,
    setMessage,
  };
}

export default useUpdateMyProfile;
