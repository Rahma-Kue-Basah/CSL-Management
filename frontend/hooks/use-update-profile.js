"use client";

import { useState } from "react";
import { API_AUTH_USER_PROFILE_DETAIL } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function useUpdateProfile() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const updateProfile = async (
    profileId,
    payload,
    currentProfile = {},
    options = {},
  ) => {
    if (!profileId) {
      throw new Error("Profile ID is missing");
    }

    // Skip request if nothing changed
    const normalizedCurrent = {
      full_name: currentProfile.name || "",
      department: currentProfile.department || null,
      batch: currentProfile.batch || null,
      id_number: currentProfile.id_number || null,
      role: currentProfile.role || null,
      user_type: currentProfile.user_type || null,
    };
    const normalizedPayload = {
      full_name: payload.full_name || "",
      department: payload.department || null,
      batch: payload.batch || null,
      id_number: payload.id_number || null,
      role: payload.role || null,
      user_type: payload.user_type || null,
    };

    const noChange = Object.keys(normalizedPayload).every(
      (key) => normalizedPayload[key] === normalizedCurrent[key],
    );

    if (noChange) {
      setMessage("Tidak ada perubahan");
      return currentProfile;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await authFetch(
        API_AUTH_USER_PROFILE_DETAIL(profileId),
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        throw new Error(`Update failed (${response.status})`);
      }

      const updated = await response.json();
      const nextProfile = {
        ...currentProfile,
        id: updated.id || currentProfile?.id,
        name: updated.full_name || updated.username || currentProfile?.name,
        email: updated.email || currentProfile?.email,
        department: updated.department,
        batch: updated.batch,
        id_number: updated.id_number,
        role: updated.role || currentProfile?.role,
        user_type: updated.user_type || currentProfile?.user_type,
      };

      if (typeof window !== "undefined" && !options.skipLocalProfileUpdate) {
        window.localStorage.setItem("profile", JSON.stringify(nextProfile));
      }

      setMessage("Profile updated");
      return nextProfile;
    } catch (err) {
      setMessage(err.message || "Update failed");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { updateProfile, isSubmitting, message, setMessage };
}

export default useUpdateProfile;
