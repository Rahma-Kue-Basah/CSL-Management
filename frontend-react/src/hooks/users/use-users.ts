"use client";

import { useEffect, useState } from "react";

import { API_AUTH_USERS } from "@/constants/api";
import { normalizeRoleValue } from "@/constants/roles";
import { authFetch } from "@/lib/auth";

export type UserFilters = {
  department?: string;
  role?: string;
  batch?: string;
  search?: string;
  q?: string;
};

type ApiUserProfile = {
  id?: number | string | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  user_type?: string | null;
  batch?: string | number | null;
  department?: string | null;
  id_number?: string | null;
};

type ApiUser = {
  id?: number | string | null;
  username?: string | null;
  email?: string | null;
  is_verified?: boolean | null;
  profile?: ApiUserProfile | null;
};

type ApiUsersResponse = {
  count?: number;
  results?: ApiUser[];
  aggregates?: {
    total?: number;
    student?: number;
    lecturer?: number;
    admin?: number;
    staff?: number;
    guest?: number;
  } | null;
};

export type UserRow = {
  id: number | string;
  uid: number | string;
  profileId: number | string | null;
  name: string;
  email: string;
  role: string;
  userType: string;
  batch: string;
  department: string;
  idNumber: string;
  isVerified: boolean;
};

export type UserRoleAggregates = {
  total: number;
  student: number;
  lecturer: number;
  admin: number;
  staff: number;
  guest: number;
};

export function mapUser(item: ApiUser): UserRow {
  const fallbackId = String(item.email ?? item.username ?? "user");
  const rawId = item.id ?? item.email ?? item.username ?? fallbackId;
  const profile = item.profile ?? {};
  const email = item.email ?? profile.email ?? "-";
  const name = profile.full_name ?? item.username ?? "-";

  return {
    id: rawId,
    uid: rawId,
    profileId: profile.id ?? null,
    name: String(name),
    email: String(email),
    role: normalizeRoleValue(profile.role) || "-",
    userType: String(profile.user_type ?? "-"),
    batch: String(profile.batch ?? "-"),
    department: String(profile.department ?? "-"),
    idNumber: String(profile.id_number ?? "-"),
    isVerified: Boolean(item.is_verified),
  };
}

export function useUserDetail(userId?: string | number | null) {
  const [user, setUser] = useState<UserRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setError("User ID tidak ditemukan.");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isAborted = false;

    const loadUser = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await authFetch(`${API_AUTH_USERS}${userId}/`, {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat detail user (${response.status})`);
        }

        const payload = (await response.json()) as ApiUser;
        setUser(mapUser(payload));
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Terjadi kesalahan saat memuat detail user.",
        );
      } finally {
        if (isAborted || controller.signal.aborted) return;
        setIsLoading(false);
      }
    };

    void loadUser();

    return () => {
      isAborted = true;
      controller.abort();
    };
  }, [userId]);

  return {
    user,
    setUser,
    isLoading,
    error,
    setError,
  };
}

export function getUserInitials(user?: Pick<UserRow, "name" | "email"> | null): string {
  const source = user?.name || user?.email || "";
  const parts = source.trim().split(/\s+/).slice(0, 2);
  const chars = parts.map((part) => part[0]).join("");
  return chars ? chars.toUpperCase() : "U";
}

export function useUsers(
  page: number,
  pageSize = 20,
  filters: UserFilters = {},
  reloadKey = 0,
) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState("");
  const [aggregates, setAggregates] = useState<UserRoleAggregates>({
    total: 0,
    student: 0,
    lecturer: 0,
    admin: 0,
    staff: 0,
    guest: 0,
  });

  useEffect(() => {
    const controller = new AbortController();
    let isAborted = false;

    const loadUsers = async () => {
      setIsLoading(true);
      setError("");

      try {
        const url = new URL(API_AUTH_USERS, window.location.origin);
        url.searchParams.set("page", String(page));
        url.searchParams.set("page_size", String(pageSize));
        if (filters.department) url.searchParams.set("department", filters.department);
        if (filters.role) url.searchParams.set("role", filters.role);
        if (filters.batch) url.searchParams.set("batch", filters.batch);
        if (filters.search) url.searchParams.set("search", filters.search);
        if (filters.q) url.searchParams.set("q", filters.q);

        const response = await authFetch(url.toString(), {
          method: "GET",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`Gagal memuat data user (${response.status})`);
        }

        const payload = (await response.json()) as ApiUsersResponse | ApiUser[];
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload.results)
            ? payload.results
            : [];
        const mappedUsers = list.map(mapUser);

        setUsers(mappedUsers);
        setTotalCount(Array.isArray(payload) ? mappedUsers.length : (payload.count ?? mappedUsers.length));
        setAggregates({
          total: Array.isArray(payload) ? mappedUsers.length : Number(payload.aggregates?.total ?? 0),
          student: Array.isArray(payload) ? 0 : Number(payload.aggregates?.student ?? 0),
          lecturer: Array.isArray(payload) ? 0 : Number(payload.aggregates?.lecturer ?? 0),
          admin: Array.isArray(payload) ? 0 : Number(payload.aggregates?.admin ?? 0),
          staff: Array.isArray(payload) ? 0 : Number(payload.aggregates?.staff ?? 0),
          guest: Array.isArray(payload) ? 0 : Number(payload.aggregates?.guest ?? 0),
        });
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Terjadi kesalahan saat memuat user.",
        );
      } finally {
        if (isAborted || controller.signal.aborted) return;
        setIsLoading(false);
        setHasLoadedOnce(true);
      }
    };

    void loadUsers();

    return () => {
      isAborted = true;
      controller.abort();
    };
  }, [
    page,
    pageSize,
    filters.department,
    filters.role,
    filters.batch,
    filters.search,
    filters.q,
    reloadKey,
  ]);

  return {
    users,
    setUsers,
    totalCount,
    setTotalCount,
    aggregates,
    isLoading,
    hasLoadedOnce,
    error,
    setError,
  };
}
