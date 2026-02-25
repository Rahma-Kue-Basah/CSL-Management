"use client";

import { useState } from "react";

import { API_AUTH_REGISTER } from "@/constants/api";
import { authFetch } from "@/lib/auth";

export type BulkRow = {
  index: number;
  full_name: string;
  email: string;
  password: string;
  role: string;
  user_type: string;
};

type BulkResult = {
  index: number;
  status: "success" | "error";
  message: string;
};

export function useBulkCreateUsers() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createUsers = async (rows: BulkRow[], onProgress?: (results: BulkResult[]) => void) => {
    setIsSubmitting(true);
    const results: BulkResult[] = [];

    try {
      for (const row of rows) {
        try {
          const payload: Record<string, string> = {
            full_name: row.full_name.trim(),
            email: row.email.trim(),
            username: row.email.trim().split("@")[0] || "user",
            password1: row.password,
            password2: row.password,
            user_type: row.user_type,
          };
          if (row.role) payload.role = row.role;

          const response = await authFetch(API_AUTH_REGISTER, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            results.push({ index: row.index, status: "success", message: "Sukses" });
          } else {
            let message = `Gagal (${response.status})`;
            try {
              const data = (await response.json()) as Record<string, unknown>;
              if (typeof data.detail === "string") message = data.detail;
              else if (Array.isArray(data.email) && typeof data.email[0] === "string") {
                message = data.email[0];
              }
            } catch {
              // ignore parse errors
            }
            results.push({ index: row.index, status: "error", message });
          }
        } catch (error) {
          results.push({
            index: row.index,
            status: "error",
            message: error instanceof Error ? error.message : "Terjadi kesalahan.",
          });
        }
        onProgress?.([...results]);
      }
    } finally {
      setIsSubmitting(false);
    }

    return results;
  };

  return { createUsers, isSubmitting };
}

export default useBulkCreateUsers;

