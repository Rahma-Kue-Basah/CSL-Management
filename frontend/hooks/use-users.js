import { useEffect, useRef, useState } from "react";

import { API_AUTH_USERS } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";

export function useUsers(page, pageSize = 20, filters = {}) {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const lastKeyRef = useRef(null);

  useEffect(() => {
    const key = JSON.stringify({ page, pageSize, filters });
    if (lastKeyRef.current === key) return;
    lastKeyRef.current = key;

    const load = async () => {
      try {
        setIsLoading(true);
        setError("");
        const url = new URL(API_AUTH_USERS);
        url.searchParams.set("page", page);
        url.searchParams.set("page_size", pageSize);
        if (filters.department) url.searchParams.set("department", filters.department);
        if (filters.role) url.searchParams.set("role", filters.role);
        if (filters.batch) url.searchParams.set("batch", filters.batch);
        if (filters.user_type) url.searchParams.set("user_type", filters.user_type);
        if (filters.search) url.searchParams.set("search", filters.search);
        if (filters.q) url.searchParams.set("q", filters.q);
        const resp = await authFetch(url.toString());
        if (!resp.ok) throw new Error("Gagal memuat data user");
        const data = await resp.json();
        const results = Array.isArray(data) ? data : data?.results || [];
        const mapped = results.map((item) => {
          const email = item.email || item.profile?.email || "-";
          return {
            id: item.id,
            uid: item.id || email,
            idNumber: item.profile?.id_number || "-",
            name: item.profile?.full_name || item.username || "-",
            email,
            isVerified: !!item.is_verified,
            role: item.profile?.role || "-",
            userType: item.profile?.user_type || "-",
            batch: item.profile?.batch || "-",
            department: item.profile?.department || "-",
          };
        });
        setUsers(mapped);
        setTotalCount(data?.count ?? mapped.length);
      } catch (e) {
        setError(e.message || "Terjadi kesalahan");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [page, pageSize, filters]);

  return {
    users,
    setUsers,
    totalCount,
    isLoading,
    error,
    setError,
  };
}
