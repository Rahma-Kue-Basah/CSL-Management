"use client";

import { useState } from "react";

import { API_AUTH_ADMIN_PROFILE_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth";
import { extractApiErrorMessage } from "@/lib/api-error";

type UpdatePayload = {
  full_name?: string;
  initials?: string;
  department?: string | null;
  batch?: string | null;
  id_number?: string | null;
  role?: string | null;
  user_type?: string | null;
  institution?: string | null;
};

export function useUpdateUserProfile() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const updateUserProfile = async (profileId: string | number, payload: UpdatePayload) => {
    if (!profileId) throw new Error("Profile ID tidak ditemukan.");

    setIsSubmitting(true);
    setMessage("");
    try {
      const response = await authFetch(API_AUTH_ADMIN_PROFILE_DETAIL(profileId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        let message = `Update gagal (${response.status})`;
        try {
          const data = (await response.json()) as unknown;
          message = extractApiErrorMessage(data, message, ["department", "batch", "role"]);
        } catch {
          // ignore parse error
        }
        throw new Error(message);
      }
      const updated = (await response.json()) as Record<string, unknown>;
      setMessage("Profile updated");
      return updated;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Update gagal.";
      setMessage(msg);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updateUserProfile, isSubmitting, message, setMessage };
}

export default useUpdateUserProfile;
