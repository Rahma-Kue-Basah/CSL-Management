"use client";

import { useState } from "react";
import Cookies from "js-cookie";
import { API_AUTH_USER_PROFILE_DETAIL } from "@/constants/api";

export function useUpdateProfile() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const updateProfile = async (profileId, payload, currentProfile = {}) => {
    if (!profileId) {
      throw new Error("Profile ID is missing");
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const accessToken =
        Cookies.get("access_token") ||
        Cookies.get("access") ||
        (typeof window !== "undefined"
          ? window.localStorage.getItem("access_token")
          : null);

      const response = await fetch(API_AUTH_USER_PROFILE_DETAIL(profileId), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

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

      if (typeof window !== "undefined") {
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
