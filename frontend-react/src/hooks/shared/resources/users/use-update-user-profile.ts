"use client";

import { useState } from "react";
import { extractApiErrorMessage } from "@/lib/core";
import {
  usersService,
  type UpdateUserProfilePayload as UpdatePayload,
} from "@/services/shared/resources";

export function useUpdateUserProfile() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const updateUserProfile = async (profileId: string | number, payload: UpdatePayload) => {
    if (!profileId) throw new Error("Profile ID tidak ditemukan.");

    setIsSubmitting(true);
    setMessage("");
    try {
      const result = await usersService.updateProfile(profileId, payload);
      if (!result.ok) {
        let message = `Update gagal (${result.status})`;
        if (typeof result.data !== "undefined") {
          message = extractApiErrorMessage(
            result.data,
            message,
            ["department", "batch", "role", "is_mentor"],
          );
        }
        throw new Error(message);
      }
      const updated = (result.data ?? {}) as Record<string, unknown>;
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
