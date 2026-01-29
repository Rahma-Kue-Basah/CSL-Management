"use client";

import { useEffect, useState } from "react";

import { API_AUTH_PIC_USERS } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function usePicUsers() {
  const [picUsers, setPicUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const resp = await authFetch(API_AUTH_PIC_USERS);
        if (!resp.ok) throw new Error("Gagal memuat data PIC.");
        const data = await resp.json();
        const results = Array.isArray(data) ? data : data?.results || [];
        const mapped = results.map((item) => ({
          id: item.id,
          profileId: item.profile_id || item.profileId || null,
          name: item.full_name || item.email || "-",
          email: item.email || "-",
          role: item.role || "-",
        }));
        setPicUsers(mapped);
      } catch (err) {
        setError(err.message || "Terjadi kesalahan.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return {
    picUsers,
    isLoading,
    error,
  };
}

export default usePicUsers;
