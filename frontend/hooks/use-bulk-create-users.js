"use client";

import { useState } from "react";

import { API_AUTH_REGISTER } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";
import { normalizeRoleInput } from "@/constants/roles";
import { USER_TYPE_VALUES } from "@/constants/user-types";

function parseCreateUserError(data) {
  if (!data || typeof data !== "object") return "Gagal (data tidak valid)";
  if (typeof data.detail === "string") return data.detail;
  if (typeof data.non_field_errors?.[0] === "string") return data.non_field_errors[0];
  if (typeof data.email?.[0] === "string") return data.email[0];
  if (typeof data.username?.[0] === "string") return data.username[0];
  return "Gagal (data tidak valid)";
}

export function useBulkCreateUsers() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createUsers = async (rows, onProgress) => {
    const results = [];
    setIsSubmitting(true);

    for (const row of rows) {
      const payload = {
        full_name: row.full_name,
        email: row.email,
        username: row.email.split("@")[0] || "user",
        password1: row.password,
        password2: row.password,
      };

      const normalizedRole = normalizeRoleInput(row.role);
      if (normalizedRole) payload.role = normalizedRole;
      payload.user_type = USER_TYPE_VALUES.INTERNAL;

      try {
        const response = await authFetch(API_AUTH_REGISTER, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let message = `Gagal (status ${response.status})`;
          try {
            const data = await response.json();
            message = parseCreateUserError(data);
          } catch (_) {
            // ignore parse error
          }
          results.push({ ...row, status: "error", message });
        } else {
          results.push({ ...row, status: "success", message: "OK" });
        }
      } catch (error) {
        results.push({
          ...row,
          status: "error",
          message: error.message || "Gagal mengirim data",
        });
      }

      if (onProgress) onProgress([...results]);
    }

    setIsSubmitting(false);
    return results;
  };

  return {
    createUsers,
    isSubmitting,
  };
}

export default useBulkCreateUsers;
